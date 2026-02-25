import numpy as np

def global_feature_importance(X):
    # Demo: variance as importance
    return np.var(X, axis=0)

def local_explanation(X, row_idx):
    # Demo: absolute value of features
    return np.abs(X[row_idx])
