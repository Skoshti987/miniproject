import os
import json
import torch
import torch.nn as nn
from torchvision import datasets, transforms, models
import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import classification_report, confusion_matrix, precision_recall_fscore_support

TEST_DIR = r'd:\Sem 3\Miniproject\ml\dataset\test'
MODELS_DIR = r'd:\Sem 3\Miniproject\ml\models'
RESULTS_DIR = r'd:\Sem 3\Miniproject\ml\results'

BATCH_SIZE = 32
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')

def evaluate_model():
    os.makedirs(RESULTS_DIR, exist_ok=True)
    model_path = os.path.join(MODELS_DIR, 'sugarcane_disease_model.pt')
    metadata_path = os.path.join(MODELS_DIR, 'model_metadata.json')

    if not os.path.exists(model_path):
        print(f"Error: Model file not found at {model_path}")
        return

    with open(metadata_path, 'r') as f:
        metadata = json.load(f)

    class_names = metadata['classes']
    num_classes = len(class_names)

    test_transforms = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])

    test_dataset = datasets.ImageFolder(TEST_DIR, transform=test_transforms)
    test_loader = torch.utils.data.DataLoader(test_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)

    # Load model architecture and weights
    model = models.mobilenet_v3_small(weights=None)
    in_features = model.classifier[3].in_features
    model.classifier[3] = nn.Sequential(
        nn.Dropout(p=0.3),
        nn.Linear(in_features, num_classes)
    )
    model.load_state_dict(torch.load(model_path, map_location=DEVICE))
    model = model.to(DEVICE)
    model.eval()

    all_preds = []
    all_targets = []

    print("Evaluating on unseen Test Dataset...", flush=True)
    with torch.no_grad():
        for inputs, labels in test_loader:
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            outputs = model(inputs)
            _, preds = torch.max(outputs, 1)

            all_preds.extend(preds.cpu().numpy())
            all_targets.extend(labels.cpu().numpy())

    all_preds = np.array(all_preds)
    all_targets = np.array(all_targets)

    # Calculate overall metrics
    precision, recall, f1, _ = precision_recall_fscore_support(all_targets, all_preds, average='weighted')
    accuracy = (all_preds == all_targets).mean()

    # Per-class metrics
    per_class_p, per_class_r, per_class_f1, per_class_sup = precision_recall_fscore_support(
        all_targets, all_preds, average=None, labels=range(num_classes)
    )

    per_class_metrics = {}
    for i, name in enumerate(class_names):
        per_class_metrics[name] = {
            "precision": round(float(per_class_p[i]), 4),
            "recall": round(float(per_class_r[i]), 4),
            "f1_score": round(float(per_class_f1[i]), 4),
            "support": int(per_class_sup[i])
        }

    metrics = {
        "model_version": metadata.get("model_version", "1.0.0"),
        "test_accuracy": round(float(accuracy), 4),
        "precision": round(float(precision), 4),
        "recall": round(float(recall), 4),
        "f1_score": round(float(f1), 4),
        "total_test_samples": len(all_targets),
        "per_class_metrics": per_class_metrics
    }

    metrics_path = os.path.join(RESULTS_DIR, 'metrics.json')
    with open(metrics_path, 'w') as f:
        json.dump(metrics, f, indent=2)

    # Plot Confusion Matrix
    cm = confusion_matrix(all_targets, all_preds)
    plt.figure(figsize=(8, 6))
    plt.imshow(cm, interpolation='nearest', cmap=plt.cm.Blues)
    plt.title('Sugarcane Disease Confusion Matrix')
    plt.colorbar()
    tick_marks = np.arange(len(class_names))
    plt.xticks(tick_marks, class_names, rotation=45)
    plt.yticks(tick_marks, class_names)

    thresh = cm.max() / 2.
    for i in range(cm.shape[0]):
        for j in range(cm.shape[1]):
            plt.text(j, i, format(cm[i, j], 'd'),
                     horizontalalignment="center",
                     color="white" if cm[i, j] > thresh else "black")

    plt.ylabel('True Class')
    plt.xlabel('Predicted Class')
    plt.tight_layout()

    cm_path = os.path.join(RESULTS_DIR, 'confusion_matrix.png')
    plt.savefig(cm_path)
    plt.close()

    print("\n===========================================================")
    print("SUGARCANE DISEASE MODEL RESULTS")
    print("===========================================================")
    print(f"Classes: {', '.join(class_names)}")
    print(f"Test Accuracy : {accuracy * 100:.2f}%")
    print(f"Precision     : {precision * 100:.2f}%")
    print(f"Recall        : {recall * 100:.2f}%")
    print(f"F1 Score      : {f1 * 100:.2f}%")
    print("===========================================================")
    print(f"Metrics JSON saved to: {metrics_path}")
    print(f"Confusion Matrix saved to: {cm_path}")

if __name__ == '__main__':
    evaluate_model()
