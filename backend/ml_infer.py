import os
import numpy as np

class DummyModel:
    def predict(self, X):
        # Heuristic: random but logical demo predictions
        preds = np.random.choice([0, 1], size=(X.shape[0],))
        confs = np.random.uniform(0.7, 0.99, size=(X.shape[0],))
        return preds, confs

class ModelLoader:
    def __init__(self, model_path):
        self.model_path = model_path
        self.model = None
        self.demo_mode = not os.path.exists(model_path)
        if not self.demo_mode:
            try:
                import torch
                self.model = torch.jit.load(model_path)
                self.model.eval()
            except Exception as e:
                print(f"[ModelLoader] Failed to load model '{model_path}': {e}")
                self.demo_mode = True

    def predict(self, X):
        if self.demo_mode or self.model is None:
            return DummyModel().predict(X)
        try:
            import torch
            with torch.no_grad():
                tensor = torch.tensor(X, dtype=torch.float32)
                out = self.model(tensor)
                preds = out.argmax(dim=1).numpy()
                confs = out.max(dim=1)[0].numpy()
                return preds, confs
        except Exception as e:
            print(f"[ModelLoader] Inference error: {e}")
            return DummyModel().predict(X)
