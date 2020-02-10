def pred(mytexts, cwd = './'):
    #Inputs : 
    #mytexts : a list of texts in the form of strings.
    #cwd : the working directory where the script is located. pred should be contained in a scripts folder, along with han_model.py
    #and the tokenizer,model and embeddings should be located in a data dir. names of those directories can be changed at the beginning of the script

    #Outputs : 3 lists of same size as the input, each containing, for each input text:
    ## prediction : the result of the prediction (int)
    ## sentences_list: the text splitted into sentences (list of strings)
    ## attentions : the attention of each sentence contained in sentences_list (list of int)

    import os
    import pickle

    from scripts.han_model import HAN
    from scripts.han_model import AttentionLayer
    from scripts.utils import rec_scorer, f1_scorer, f2_scorer
    import numpy as np

    from keras.preprocessing.sequence import pad_sequences
    from keras.models import load_model

    from nltk.tokenize import sent_tokenize


    out_file = 'HAN_manual_epoch_best_model.hd5'
    tokenizer_file = 'HAN_manual_epochword_tokeniser'
    embeddings_file = "w2v_reports_128.vec"
    data_dir = cwd + "/scripts/data/"
    

    params = {
        'MAX_WORDS_PER_SENT': 40,
        'MAX_SENT': 80,
        'max_words': 10000,
        'embedding_dim': 128,
        'word_encoding_dim': 256,
        'sentence_encoding_dim': 256,
        'l1': 0,
        'l2': 0,
        'dropout': 0.2,
        'MAX_EVALS': 10,  # number of models to evaluate with hyperopt
        'Nepochs': 100,
        'lr': 0.001
    }

    # loading tokeniser
    with open(os.path.join(data_dir,tokenizer_file), 'rb') as handle:
        word_tokenizer = pickle.load(handle)

    # Load the embeddings from a file
    embeddings = {}

    with open(os.path.join(data_dir, embeddings_file),
              encoding='utf-8') as file:  # imdb_w2v.txt . w2v_reports_128.vec
        for line in file:
            values = line.split()
            word = values[0]
            coefs = np.asarray(values[1:], dtype='float32')

            embeddings[word] = coefs
    # Initialize a matrix to hold the word embeddings
    embedding_matrix = np.random.random(
     (len(word_tokenizer.word_index) + 1, params['embedding_dim'])
    )

    # Let the padded indices map to zero-vectors. This will
    # prevent the padding from influencing the results
    embedding_matrix[0] = 0


    # Loop though all the words in the word_index and where possible
    # replace the random initalisation with the GloVe vector.
    for word, index in word_tokenizer.word_index.items():
        embedding_vector = embeddings.get(word)
        if embedding_vector is not None:
            embedding_matrix[index] = embedding_vector


    #####################################################
    # Tokenization                                      #
    #####################################################

    # Construct the input matrix. This should be a nd-array of
    # shape (n_samples, MAX_SENT, MAX_WORDS_PER_SENT).
    # We zero-pad this matrix (this does not influence
    # any predictions due to the attention mechanism.
    X = np.zeros((len(mytexts),params['MAX_SENT'], params['MAX_WORDS_PER_SENT']), dtype='int32')
    #We save the sentences of the texts for future vizualization
    sentences_list = []

    for i, review in enumerate(mytexts):
        sentences = sent_tokenize(review)
        sentences_list.append(sentences)
        tokenized_sentences = word_tokenizer.texts_to_sequences(
            sentences
        )
        tokenized_sentences = pad_sequences(
            tokenized_sentences, maxlen=params['MAX_WORDS_PER_SENT']
        )

        pad_size = params['MAX_SENT'] - tokenized_sentences.shape[0]

        if pad_size < 0:
            tokenized_sentences = tokenized_sentences[0:params['MAX_SENT']]
        else:
            tokenized_sentences = np.pad(
                tokenized_sentences, ((0, pad_size), (0, 0)),
                mode='constant', constant_values=0
            )

        # Store this observation as the i-th observation in
        # the data matrix
        X[i] = tokenized_sentences

    #################
    # model
    #################

    han_model = load_model(os.path.join(data_dir,out_file),
                           custom_objects={'HAN': HAN,'AttentionLayer': AttentionLayer,
                                           'rec_scorer':rec_scorer, 'f1_scorer':f1_scorer,
                                          'f2_scorer':f2_scorer})

    ################################
    # predict
    from keras import backend as K
    predictions = han_model.predict(X)
    # Get sentence attentions
    attentions = HAN.predict_sentence_attention(han_model,X)
    #Get word attentions
    word_attentions = HAN.predict_word_attention(han_model,X)
    #Clear session for cache purpose
    K.clear_session()
    # output
    return (predictions,sentences_list,attentions,word_attentions)
