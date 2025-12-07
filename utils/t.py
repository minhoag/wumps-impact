import polars as pl
from constants import ITEMS

def search_items(query: str, file):
        df = pl.read_csv(file)
        df = df.filter(pl.col('vietnameseName').str.contains(query) | pl.col('globalName').str.contains(query))
        return df.to_dicts()

def main():
    print(search_items('Alhaitham', ITEMS))

if __name__ == '__main__':
    main()