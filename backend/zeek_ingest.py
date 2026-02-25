import os
import time
import pandas as pd

def tail_zeek_log(path, interval=2):
    last_size = 0
    while True:
        size = os.path.getsize(path)
        if size > last_size:
            df = pd.read_csv(path, skiprows=last_size)
            yield df
            last_size = size
        time.sleep(interval)
