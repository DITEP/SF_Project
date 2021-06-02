def rf_inference(mytext,model_file):
    try:
        #Inputs : 
        #mytext : a text in the form of a string to make the prediction on.

        #model_file : the name of the model file to load contained in controllers/data/
        
        #Outputs : 
        #The result of the prediction as a float.
        import os
        import pickle

        
        import numpy as np

        data_dir = "./controllers/data"
        cluster_file = "clusters.txt"
        
        params = {
            'NB_CLUSTERS': 140,
        }

        ##PREPROCESS text
        from stop_words import get_stop_words
        stop_wordsFR = get_stop_words('french')
        import spacy
        from spacy.lang.fr.examples import sentences 
        sind="!#$%&\(*+,-)/:;. <=>?@[\\]^_`{|}~0123456789'"


        nlp = spacy.load("fr_core_news_md")
        doc = nlp(mytext)
        preprocessed_text = []
        for token in doc:
            tok_str=str(token.lemma_.lower())
            if tok_str not in (stop_wordsFR) and tok_str != "\n":
                for char in sind:
                    tok_str=tok_str.replace(char,"")
                    # tok_end.append(tok_str.translate(str.maketrans("\n\t\r", "   ")))
                if len(tok_str)!=0:
                    preprocessed_text.append(tok_str)
        if len(preprocessed_text)<50:
            raise Exception("Text is too short")

        ##TURN TEXT TO CLUSTER VECTOR
        with open(os.path.join(data_dir,cluster_file),'r',encoding="utf8") as f:
            cluster_lines = f.readlines()
        clusters = [cluster_line.split(",") for cluster_line in cluster_lines]
        print(clusters)
        
        transformed_text = np.zeros(params["NB_CLUSTERS"])
        cnt_words=0
        for word in preprocessed_text:
            cluster_id = find_cluster(word,clusters)
            if cluster_id > 0:
                transformed_text[cluster_id] += 1
                cnt_words += 1

        if cnt_words>0:
            transformed_text/=cnt_words
        
        #################
        # model
        #################
        with open(os.path.join(data_dir,model_file), 'rb') as file:
            rf_model = pickle.load(file)

        #predict patient SF/SSD
        result = rf_model.predict(transformed_text)
        
        return result
    except Exception as error:
        print(error)
        return -1

def find_cluster(word,clusters):
    for i,cluster in enumerate(clusters):
        if word in cluster:
            return i
    return -1