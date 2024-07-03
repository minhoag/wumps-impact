import json
import os
 
# the file to be converted to 
# json format
directory = os.getcwd()
filename = '{}/tool/handbook.txt'.format(directory)
 
# dictionary where the lines from
# text will be stored
result = []
 
# creating dictionary
with open(filename, encoding="utf8") as fh:
 
    for line in fh:
        # reads each line and trims of extra the spaces 
        # and gives only the valid words
        if not line.startswith("//"):
            dict = line.strip().split(":")
            if len(dict)>1:
                dict1 = {
                    "name": dict[1].rstrip().lstrip() + ": " + dict[0].rstrip().lstrip(),
                    "value": dict[0].rstrip().lstrip()
                }
                result.append(dict1)
# creating json file
# the JSON file is named as test1
out_file = open("{}/handbook.json".format(directory), "w", encoding="utf8")
json.dump(result, out_file, indent = 4, sort_keys = False, ensure_ascii=False)
out_file.close()