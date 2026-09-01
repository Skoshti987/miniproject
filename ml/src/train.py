import os
import json
import time
import torch
import torch.nn as nn
import torch.optim as optim
from torchvision import datasets, transforms, models
import matplotlib.pyplot as plt
from datetime import datetime

TRAIN_DIR = r'd:\Sem 3\Miniproject\ml\dataset\train'
VAL_DIR = r'd:\Sem 3\Miniproject\ml\dataset\validation'
MODELS_DIR = r'd:\Sem 3\Miniproject\ml\models'
RESULTS_DIR = r'd:\Sem 3\Miniproject\ml\results'

BATCH_SIZE = 64
EPOCHS_HEAD = 2
EPOCHS_FINE = 3
LR_HEAD = 1e-3
LR_FINE = 1e-4
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def train_model():
    os.makedirs(MODELS_DIR, exist_ok=True)
    os.makedirs(RESULTS_DIR, exist_ok=True)

    print(f"Training using Device: {DEVICE}", flush=True)

    # Fast Data Transforms
    train_transforms = transforms.Compose([
        transforms.Resize((160, 160)),
        transforms.RandomHorizontalFlip(),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    val_transforms = transforms.Compose([
        transforms.Resize((160, 160)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    train_dataset = datasets.ImageFolder(TRAIN_DIR, transform=train_transforms)
    val_dataset = datasets.ImageFolder(VAL_DIR, transform=val_transforms)

    train_loader = torch.utils.data.DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = torch.utils.data.DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    print(f"Classes ({num_classes}): {class_names}", flush=True)

    weights = models.MobileNet_V3_Small_Weights.DEFAULT
    model = models.mobilenet_v3_small(weights=weights)

    for param in model.parameters():
        param.requires_grad = False

    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )

    model = model.to(DEVICE)
    criterion = nn.CrossEntropyLoss()

    history = {
        "train_loss": [], "val_loss": [],
        "train_acc": [], "val_acc": []
    }

    best_val_acc = 0.0
    best_model_path = os.path.join(MODELS_DIR, 'sugarcane_disease_model.pt')

    # Phase 1: Train Top Classifier Head
    print("\n--- Phase 1: Training Classification Head ---", flush=True)
    optimizer = optim.Adam(model.classifier.parameters(), lr=LR_HEAD)

    for epoch in range(EPOCHS_HEAD):
        t0 = time.time()
        model.train()
        running_loss = 0.0
        corrects = 0

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()

            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            corrects += torch.sum(preds == labels.data)

        train_loss = running_loss / len(train_dataset)
        train_acc = (corrects.double() / len(train_dataset)).item()

        model.eval()
        val_running_loss = 0.0
        val_corrects = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                outputs = model(inputs)
                loss = criterion(outputs, labels)

                _, preds = torch.max(outputs, 1)
                val_running_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)

        val_loss = val_running_loss / len(val_dataset)
        val_acc = (val_corrects.double() / len(val_dataset)).item()

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["train_acc"].append(train_acc)
        history["val_acc"].append(val_acc)

        print(f"Epoch {epoch+1}/{EPOCHS_HEAD} [{time.time()-t0:.1f}s] - Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}", flush=True)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), best_model_path)

    # Phase 2: Unfreeze upper layers for Fine-tuning
    print("\n--- Phase 2: Fine-Tuning Upper Layers ---", flush=True)
    for param in model.features[-3:].parameters():
        param.requires_grad = True

    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()), lr=LR_FINE)

    for epoch in range(EPOCHS_FINE):
        t0 = time.time()
        model.train()
        running_loss = 0.0
        corrects = 0

        for inputs, labels in train_loader:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            optimizer.zero_grad()

            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()

            _, preds = torch.max(outputs, 1)
            running_loss += loss.item() * inputs.size(0)
            corrects += torch.sum(preds == labels.data)

        train_loss = running_loss / len(train_dataset)
        train_acc = (corrects.double() / len(train_dataset)).item()

        model.eval()
        val_running_loss = 0.0
        val_corrects = 0

        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                outputs = model(inputs)
                loss = criterion(outputs, labels)

                _, preds = torch.max(outputs, 1)
                val_running_loss += loss.item() * inputs.size(0)
                val_corrects += torch.sum(preds == labels.data)

        val_loss = val_running_loss / len(val_dataset)
        val_acc = (val_corrects.double() / len(val_dataset)).item()

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["train_acc"].append(train_acc)
        history["val_acc"].append(val_acc)

        print(f"Epoch {epoch+1+EPOCHS_HEAD}/{EPOCHS_HEAD+EPOCHS_FINE} [{time.time()-t0:.1f}s] - Train Loss: {train_loss:.4f} Acc: {train_acc:.4f} | Val Loss: {val_loss:.4f} Acc: {val_acc:.4f}", flush=True)

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), best_model_path)

    # Plot Training History
    plt.figure(figsize=(12, 5))
    plt.subplot(1, 2, 1)
    plt.plot(history["train_acc"], label="Train Accuracy")
    plt.plot(history["val_acc"], label="Val Accuracy")
    plt.title("Model Accuracy History")
    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.legend()
    plt.grid(True)

    plt.subplot(1, 2, 2)
    plt.plot(history["train_loss"], label="Train Loss")
    plt.plot(history["val_loss"], label="Val Loss")
    plt.title("Model Loss History")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.legend()
    plt.grid(True)

    history_plot_path = os.path.join(RESULTS_DIR, 'training_history.png')
    plt.tight_layout()
    plt.savefig(history_plot_path)
    plt.close()

    # Save Metadata
    metadata = {
        "model_version": "1.0.0",
        "model_architecture": "MobileNetV3_Small",
        "classes": class_names,
        "training_date": datetime.now().strftime("%Y-%m-%d"),
        "best_val_accuracy": round(best_val_acc, 4)
    }
    with open(os.path.join(MODELS_DIR, 'model_metadata.json'), 'w') as f:
        json.dump(metadata, f, indent=2)

    print(f"\nModel training finished! Best validation accuracy: {best_val_acc:.4f}", flush=True)
    print(f"Model saved to {best_model_path}", flush=True)
    print(f"History plot saved to {history_plot_path}", flush=True)

if __name__ == '__main__':
    train_model()
