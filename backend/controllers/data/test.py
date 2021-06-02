with open("clusters.txt",'r',encoding="utf8") as f:
        cluster_lines = f.readlines()
clusters = [cluster_line.split(",") for cluster_line in cluster_lines]
print(clusters)