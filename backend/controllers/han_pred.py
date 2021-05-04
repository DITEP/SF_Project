def han_inference(mytext,model_file):
    try:
        #Inputs : 
        #mytext : a text in the form of a string to make the prediction on.

        #model_file : the name of the model file to load contained in controllers/data/
        
        #Outputs : 
        #The result of the prediction. It is contained in a list as model sees it as a vector of size 1,
        #hence it looks like [result]
        #Textviews. A list of the sentences of the text as seen by the algorithm, meaning after tokenization and padding. 
        #Is a list of string.
        #sentence_attentions. The attention values for sentences. An array of size (params['MAX_SENT'])
        #word_attentions. The attention values for words. An array of size (params['MAX_SENT'],params['MAX_WORDS_PER_SENT'])

        import os
        import pickle

        from controllers.han_model import HAN,AttentionLayer
        import numpy as np

        from keras.preprocessing.sequence import pad_sequences
        from keras.models import load_model

        from nltk.tokenize import sent_tokenize


        
        tokenizer_file = 'HAN_manual_epochword_tokeniser'
        data_dir = "./controllers/data"
        

        params = {
            'MAX_WORDS_PER_SENT': 50,
            'MAX_SENT': 60,
        }

        # loading tokeniser
        with open(os.path.join(data_dir,tokenizer_file), 'rb') as handle:
            word_tokenizer = pickle.load(handle)

        #####################################################
        # Tokenization                                      #
        #####################################################

        # Construct the input matrix. This should be a nd-array of
        # shape (n_samples, MAX_SENT, MAX_WORDS_PER_SENT).
        # We zero-pad this matrix (this does not influence
        # any predictions due to the attention mechanism.
        X = np.zeros((params['MAX_SENT'], params['MAX_WORDS_PER_SENT']), dtype='int32')
        #Sentences of the texts are saved for future vizualization
        textviews = []

        sentences = sent_tokenize(mytext)
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
        ##Creating a view of the text from the algorithm perspective, that is after padding and tokenizing.
        sentence = 0
        while (sentence < params['MAX_SENT']):
            if tokenized_sentences[sentence].any():
                sentenceview = ''
                word = 0
                #Finding the end of the words' padding
                while(tokenized_sentences[sentence][word] == 0):
                    word += 1
                while(word<params['MAX_WORDS_PER_SENT']):
                    sentenceview += word_tokenizer.index_word[tokenized_sentences[sentence][word]] + ' '
                    word += 1
                sentenceview = sentenceview[:-1] + '.'
                textviews.append(sentenceview)
            sentence += 1


        #################
        # model
        #################
        han_model = load_model(os.path.join(data_dir,model_file),
                            custom_objects={'HAN': HAN,'AttentionLayer': AttentionLayer})
        
        #input must be an array                           
        X = np.array([tokenized_sentences])
        ################################
        #Here, we always take the first value because we are predecting only 1 text and keras returns a list in 
        #case we were predecting more than one text. Same goes for attention values.
        # predict
        from keras import backend as K
        predictions = han_model.predict(X)[0]
        # Get sentence attentions
        sentence_attentions = HAN.predict_sentence_attention(han_model,X)[0]
        #Get word attentions
        word_attentions = HAN.predict_word_attention(han_model,X)[0]
        #Clear session for cache purpose
        K.clear_session()
        # output
        return (predictions,textviews,sentence_attentions,word_attentions)
    except Exception as error:
        print(error)
        return (-1,-1,-1,-1)
