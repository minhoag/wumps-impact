import os
import logging
import time

if not os.path.exists('logs'):
    os.mkdir('logs')

start_time = time.time()

def get_runtime() -> float:
    return time.time() - start_time

formatter = logging.Formatter('|BOTSERVER|%(asctime)s|%(levelname)s|%(filename)s|%(message)s')

class RuntimeFilter(logging.Filter):
    def filter(self, record):
        record.runtime = f"{get_runtime():.2f}"
        return True

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

console_hander = logging.StreamHandler()
console_hander.setLevel(logging.DEBUG)

console_hander.setFormatter(formatter)

logger.addFilter(RuntimeFilter())
logger.addHandler(console_hander)
