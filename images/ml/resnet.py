import torch
from torchvision import models, transforms
from torchvision.models import ResNet50_Weights
from PIL import Image

weights = ResNet50_Weights.IMAGENET1K_V1
model = models.resnet50(weights=weights)
model.eval()

IMAGENET_LABELS = weights.meta["categories"]

transform = transforms.Compose([
    transforms.Resize(256),
    transforms.CenterCrop(224),
    transforms.ToTensor(),
    transforms.Normalize(
        mean=[0.485, 0.456, 0.406],
        std=[0.229, 0.224, 0.225],
    )
])

def predict_tags(image_path, top_k=5):
    image = Image.open(image_path).convert("RGB")
    tensor = transform(image).unsqueeze(0)

    with torch.no_grad():
        outputs = model(tensor)
        probs = torch.nn.functional.softmax(outputs[0], dim=0)

    top_probs, top_idxs = torch.topk(probs, top_k)

    tags = [IMAGENET_LABELS[idx.item()] for idx in top_idxs]
    return tags
