import os
import logging
import time

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

# Console handler
console_handler = logging.StreamHandler()
console_handler.setLevel(logging.DEBUG)
console_handler.setFormatter(formatter)

logger.addFilter(RuntimeFilter())
logger.addHandler(console_handler)
