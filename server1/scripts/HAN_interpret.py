# -*- coding: utf-8 -*-
"""
Created on Mon Sep  2 11:03:23 2019

interpret HAN predictions

@author: Loic Verlingue
"""

'''
loads and perform prediction with pre-trained HAN (hierachical attention network, specialized neural net for NLP tasks) models
Code inspired from: FlorisHoogenboom.
https://github.com/FlorisHoogenboom/keras-han-for-docla

Requirements:
needs in data_dir: 
    w2v_reports_128.vec (word2vec. Dictionnaire vectors representing each words)
    word_tokeniser, out_file+'_model.hd5' # optionnaly df_all.csv (hyperopt training results), if "load test cohort" active
needs in scripts_dir: utils.py, han_model.py used to build the HAN model
'''

################
# directories
################
out_file = 'HAN_50epoch5eval'
data_dir="/mnt/beegfs/scratch/l_verlingue/NLP/CondaCloneWrkFlow/data/"
#results_dir="/mnt/beegfs/scratch/l_verlingue/NLP/CondaCloneWrkFlow/results/"
scripts_dir="/mnt/beegfs/scratch/l_verlingue/NLP/CondaCloneWrkFlow/scripts/"
#out_file="HAN"
#data_dir="C:/Users/L_VERLINGUE/Desktop/DITEP/ClinicPhase1/scripts/FullWorkflow"
#data_dir="C:/Users/L_VERLINGUE/Desktop/DITEP/ClinicPhase1/scripts/FullWorkflow/results/"
#scripts_dir="C:/Users/L_VERLINGUE/Desktop/DITEP/ClinicPhase1/scripts/FullWorkflow"

#################
# libraries
#################

import os
import pandas as pd
import numpy as np
import keras
from keras import backend as K
#from keras import backend as K
from keras.layers import (
    Dense, GRU, TimeDistributed, Input,
    Embedding, Bidirectional, Lambda, Dropout
)
#from keras.models import Model
from keras.preprocessing.text import Tokenizer
from keras.preprocessing.sequence import pad_sequences
#from keras import regularizers
from keras.models import load_model
#from keras.optimizers import Adam

from nltk.tokenize import sent_tokenize
import nltk
nltk.download('punkt')

#import matplotlib
#matplotlib.use('agg')
#import matplotlib.pyplot as plt

#from sklearn.metrics import confusion_matrix

import pickle # to save and load keras tokeniser

import matplotlib
matplotlib.use('agg')
import matplotlib.pyplot as plt
import seaborn as sns

os.chdir(scripts_dir)
from han_model import HAN
from han_model import AttentionLayer
from utils import rec_scorer, f1_scorer, f2_scorer
os.chdir(data_dir)

#################
# hyperparameters
#################
#trained_params=pd.read_csv(os.path.join(data_dir, out_file+"all.csv"), encoding='utf-8') # check
##trained_params=pd.DataFrame({'l1':[0.1,0.3],'l2':[0.2,0.1],'f1':[0.9,0.96]})
#trained_params=trained_params.loc[trained_params['f1']==trained_params['f1'].max(),]

params={
        'MAX_WORDS_PER_SENT' : 40,
        'MAX_SENT' : 80,
        'max_words' : 10000,
        'embedding_dim' : 128,
        'word_encoding_dim':256,
        'sentence_encoding_dim':256,
        'l1':0,
        'l2':0,
        'dropout':0.2,
        'MAX_EVALS' : 10, # number of models to evaluate with hyperopt
        'Nepochs' : 100,
        'lr':0.001
        }

# replace by best trained parameters
#hp_names=trained_params.columns.values[trained_params.columns.values!='f1']

#for key in hp_names:
#    params[key]=trained_params[key]


#####################################################
# Word Embeddings                                   #
#####################################################

# Now, we need to build the embedding matrix. For this we use
# a pretrained (on the wikipedia corpus) 100-dimensional GloVe
# model.  # to update

# loading tokeniser
with open(os.path.join(data_dir,'word_tokeniser'), 'rb') as handle:
    word_tokenizer = pickle.load(handle)

# Load the embeddings from a file
embeddings = {}

with open(os.path.join(data_dir, "w2v_reports_128.vec"),
          encoding='utf-8') as file:  # imdb_w2v.txt . w2v_reports_128.vec
    dummy = file.readline()
    for line in file:
        values = line.split()
        word = values[0]
        coefs = np.asarray(values[1:], dtype='float32')

        embeddings[word] = coefs

#embeddings['fatigue']
# Initialize a matrix to hold the word embeddings
embedding_matrix = np.random.random(
    (len(word_tokenizer.word_index) + 1, params['embedding_dim'])
)

# Let the padded indices map to zero-vectors. This will
# prevent the padding from influencing the results
embedding_matrix[0] = 0

# Loop though all the words in the word_index and where possible
# replace the random initalization with the GloVe vector.
for word, index in word_tokenizer.word_index.items():
    embedding_vector = embeddings.get(word)
    if embedding_vector is not None:
        embedding_matrix[index] = embedding_vector

#################
# New Data
#################

# entry
texts = ['le patient va bien. examen clinique normal. signature du consentement']
texts = ['le patient ne va pas bien. antecedant infarctus et atherome. cytolyse hepatique. signes d insuffisance cardique. prescription echographie cardiaque.']
texts=['cr dicte par dr thibault constance avec le dr varga andrea patiente de 53 ans adressee par le docteur cojocarasu oncologue au centre hospitalier du mans vu le 20 06 14 pour discuter de la possibilite d une inclusion dans un protocole de phase i dont le titre est met servier evaluant un inhibiteur de tirosine kinase de met dans le cadre de la prise en charge therapeutique d un carcinome epidermoide de localisation ganglionnaire sus et sous diaphragmatique sans primitif retrouve en progression apres une ligne de traitement. 20 06 14 met servier met servier medicaux cystite recidivante hepes genital kyste dentaire chirurgicaux chirurgie pour une endometriose polypes uterins reseques medicaux cystite recidivante hepes genital hepes genital kyste dentaire chirurgicaux chirurgicaux chirurgie pour une endometriose chirurgie pour une endometriose polypes uterins reseques allergie pas d allergie medicamenteuse connue pas d allergie medicamenteuse connue pas d allergie medicamenteuse connue allergie au graminees allergie au graminees allergie au graminees professeur des ecoles actuellement en arret maladie mariee 3 enfants consommation d alcool occasionnelle pas d intoxication tabagique juillet 2013 decouverte d une adenopathie sus claviculaire evoluant depuis plusieurs mois dont la biopsie revele la presence d un carcinome epidermoide moyennement differencie d origine difficile a determiner. le bilan realise a l epoque examen orl gynecologique scanner tap tep scanner fogd examen proctologique ne retrouve pas de primitif. la maladie est alors localisee au niveau ganglionnaire excusivement avec des localisations sus et sous diaphragmatiques adenopathies cervicales bilaterales sus claviculaires gauche lombo aortiques . 1ere ligne par cisplatine 5fu 6 cycles realises du 01 10 2013 au 28 01 2014 avec une reponse metabolique partielle apres 3 cycles et une reponse metabolique complete apres 6 cycles. l evaluation par tep scanner realise le 27 05 2014 retrouve une reevolution tumorale avec reapparition d un hypermetabolisme au niveau ganglionnaire sus claviculaire gauche mediastinal latero aortique et inter aortico cave et iliaque bilateral. la patiente est adressee pour discuter de l inclusion dans le protocole cl1 met servier. taille 170 cm poids 53 2 kg ecog 0 pouls 84 p min temperature 36 4 degc pression sanguine 93 63 bras aucun respiration frequency 16 r min saturation o2 98 eva 0 ecg n a bilan a jeun n a auscultation cardiaque sans particularite auscultation pulmonaire sans particularite aires ganglionnaires pas d adenopathie cervicale ni axillaire retrouvee empatement sans reelle adenopathie au niveau du creux sus claviculaire gauche abdomen souple depressible et indolore sans particularite sans particularite bilan biologique date 20 06 2014 nfs 4300 leucocytes hb 8 6 g dl hematocrite 25 palquettes 170 000 bilan biologique ionogramme sanguin sodium 141 mmol l potassium 4 mmol l uree 8 5 mmol l creatinine 109 umol l clairance en mdrd 48 ml min bilan hepatique normal albumine 38 g l ldh normaux bilan lipidique normal troponine 0 06 ug l en pratique nous expliquons avec le dr varga ce jour a la patiente en presence de son mari les principes les contraintes et les incertitudes therapeutiques ainsi que les risques potentiels des effets secondaires des essais de phase i. j explique egalement la necessite de venir de facon hebdomadaire dans notre institut et de realiser un bilan biologique avant chaque consultation. je remets ce jour au patient la notice d information et le formulaire de consentement eclaire version 23 01 2014 pour cette etude. compte tenu de la prise de seroplex qui est contre indique en raison du risque d allongement du qt apres avis aupres des psychiatres de l igr remplacement par du zoloft 100 mg j en une prise le matin. je verifie les criteres d inclusion et de non inclusion et les eventuels traitements concomitants interdits. la patiente est bien eligible pour l essai de phase i met servier sous reserve d un controle de l hemoglobine et de la normalisation de la creatinine ce jour a 109 soit une clairance 60 ml min sur probable deshydratation. un bilan de controle sera realise le 23 06 2014 apres supplementation martiale en cas de carence et rehydratation. elle en accepte les principes et les contraintes. il signe ce jour le consentement eclaire version 23 01 2014 de participation au protocole de phase i met servier on prevoit l organisation du bilan de screening en collaboration avec l arc referent pousse houda de ce protocole. 23 01 2014 23 01 2014 le bilan sera complete par un scanner tap et une echographie cardiaque dans le bilan pre therapeutique.']
texts=['cr dicte par dr touat mehdi dr touat mehdi dr touat mehdi patiente de 58 ans vue le 17 06 14 en consultation accompagnee de son epoux au cours du bilan de screening du protocole de phase i afa cetux pour la prise en charge therapeutique d un adenocarcinome pancreatique en recidive loco regionale hepatique et ganglionnaire. 17 06 14 afa cetux antecedents medicaux hemiplegie droite a la naissance sequelle moderee a type d hemiparesie distale au membres superieur et inferieur droits chirurgicaux appendicectomie en 1961. mode de vie mariee 3 filles de 38 32 et 26 ans. ancienne auxilliaire de puericulture puis assistante maternelle. absence de tabagisme ou de consommation d alcool. antecedents mode de vie traitements traitements creon 25 000 ui 1 cp x 3 j depuis avril 2013. omeprazole 20 mg 1 cp le soir depuis avril 2013. tardyferon 80 mg 1 cp par matin et soir depuis le 15 05 2014. innohep 0 4 ml depuis le 15 05 2014 pour une thrombose veineuse profonde des membres inferieurs bilateraux. smecta 1 sachet x 3 j si besoin. erythropoietine en sc depuis le 24 05 2014. paracetamol 1 g si besoin. alimentation parenterale 1 l 15 heures la nuit depuis mars 2014. histoire de la maladie decouverte en novembre 2012 devant l apparition d un ictere cutaneo muqueux d une masse de la tete du pancreas. realisation d une duodenopancreatectomie cephalique dpc le 14 03 2013 a l hopital antoine beclere par le pr smadja. il s agissait d un adenocarcinome du pancreas classe pt3 n1 en post operatoire. traitement adjuvant par gemzar pendant 6 mois d avril 2013 a septembre 2013. progression en janvier 2014 avec apparition de metastases hepatiques multiples et d une recidive loco regionale. reprise d une chimiotherapie par folfirinox du 21 02 2014 au 18 04 2014 au total 5 cycles sans reponse au traitement. a noter que la tolerance de la chimiotherapie a ete mediocre sur leplan digestif. derniere cure realisee le 18 04 2014. histoire de la maladie inclusion dans le protocole de phase i afa cetuximab signature du consentement eclaire le 11 06 2014. symptomatologi e asthenie de grade i. appetit correct avec reprise de 2 kg depuis la mise en place de la nutrition parenterale. symptomatologi e concernant les douleurs la patiente se plaint de l apparition depuis 3 semaines de douleurs lombaires predominantes le soir partiellement soulagees par la prise de doliprane. taille 151 cm poids 36 6 kg ecog 1 pouls 80 p min temperature 37 degc pression sanguine 113 73 bras droit respiration frequency 16 r min saturation o2 100 eva 0 ecg protocolaire bilan a jeun n a auscultation cardiaque normale auscultation pulmonaire normale aires ganglionnaires normales examen cutaneo muqueux normal examen neurologique minime hemiparesie predominant en distalite aux membres superieur et aux membres inferieur droits tres ancienne . auscultation cardiaque normale normale auscultation pulmonaire normale normale aires ganglionnaires normales normales examen cutaneo muqueux normal normal bilan biologique date 17 06 2014 bilan biologique ionogramme uree creatinine normaux bilan hepatique asat alat 1 5x la normale pal 616 ggt 631 bilirubine 21 normale a 17 lipase normale troponine cpk ldh normales nfs normale en dehors d une lymphopenie a 800 tp tca hemolyse scanner tap 17 06 2014 scanner tap un scanner tap et cerebral evaluation des cibles c1 nodule du foie gauche image 52 taille 17 mm . c2 nodule du foie droit segment vi image 74 taille 15 mm . somme 32 mm. conclusion a noter une probable embolie pulmonaire segmentaire du segment apical du lobe inferieur droit sur thrombose de la veine iliaque externe gauche et veine femorale superficielle gauche. on confirme la presence de cibles mesurables selon recist notamment au niveau hepatique. scintigraphie cardiaque normale fevg estimee a 72 ecg normal bu proteine 1x reste normal. pas de contre indication a l inclusion dans le protocole au vu des examens realises ce jour. nous sommes contacte par le dr amary qui interprete ce jour le scanner et constate la presence de thrombose de la veine iliaque primitive gauche de la veine femorale superficielle gauche avec probable embolie pulmonaire segmentaire lobaire inferieure droite. on rappelle que la patiente est deja sous innohep 0 4 ml jour depuis le 15 05 14 pour une thrombose veineuse bilaterale aux membres inferieurs. cette embolie et cette thrombose iliaque n etaient pas presentes sur le precedent scanner et ce sont constituees sous innohep 0 4. a l examen clinique aucun signe de gravite en particulier frequence cardiaque et saturation normale absence de signe d insuffisance cardiaque absence de signe de detresse respiratoire absence de douleur thoracique. saturation en oxygene normale en air ambiant. compte tenu de l extension de la thrombose sous innohep 0 4 et en l absence de signe de gravite clinique ce jour a l examen on propose une augmentation de l innohep a 0 5 ml jour. la patiente sera revue le 19 06 2014 pour initiation des traitements.']
#texts=text2
# to debug format
#texts=pd.DataFrame({'review':[str(text1),str(text2)]})

#################
# Data
#################

df_all=pd.read_csv(os.path.join(data_dir, "df_all.csv"), encoding='utf-8')
df_all=df_all[df_all['CompleteValues']]

# Transform the labels into a format Keras can handle
labels = df_all['screenfail']
y = np.asarray(labels)  # to_categorical(labels)

texts = df_all['value']
texts = pd.Series.tolist(texts)
split = df_all['Cohort']

#####################################################
# Tokenization                                      #
#####################################################

# Build a Keras Tokenizer that can encode every token
# saving tokeniser
try:    
    with open(os.path.join(results_dir,out_file+'word_tokeniser'), 'rb') as handle:
        word_tokenizer = pickle.load(handle)
except FileNotFoundError:
    print("Tokeniser not found")
    
# Construct the input matrix. This should be a nd-array of
# shape (n_samples, MAX_SENT, MAX_WORDS_PER_SENT).
# We zero-pad this matrix (this does not influence
# any predictions due to the attention mechanism.

# to select only 1 exemple do:
#texts=texts[0]
#i=0
  
X = np.zeros((len(texts),params['MAX_SENT'], params['MAX_WORDS_PER_SENT']), dtype='int32')

for i, review in enumerate(texts):
    sentences = sent_tokenize(review)
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
    X[i] = tokenized_sentences[None, ...]

X.shape
#################
# model
#################

han_model = load_model(os.path.join(data_dir,out_file+'_model.hd5'), 
                       custom_objects={'HAN': HAN,'AttentionLayer': AttentionLayer, 
                                       'rec_scorer':rec_scorer, 'f1_scorer':f1_scorer, 
                                       'f2_scorer':f2_scorer})

han_model.summary()

################################
# predict

prediction = han_model.predict(X)
# output
print(prediction)

###############################
# return sentence attentions
#from keras.models import Model

attention_sentence=predict_sentence_attention(han_model, X)
attention_sentence.shape

# print frequencies for several exemples
# laborieux....
POS=list()
SD=list()
MAX=list()
for i in range(len(attention_sentence)):
    PO=np.where(attention_sentence[i]==max(abs(attention_sentence[i])) )
    POS.append(PO)
    MX=max(abs(attention_sentence[i]))
    MAX.append(MX)
    STD=np.std(attention_sentence[i])
    SD.append(STD)

np.asarray(POS)
POS.__class__

POS=np.asarray(POS).ravel()
SD=np.asarray(SD).ravel()
MAX=np.asarray(MAX).ravel()
#POS=np.array([4,4,4,3,3])

'''
plt.hist(POS, bins=80)
plt.xlabel('Position of the sentence in documents')
plt.ylabel('Frequency')
plt.title('Highest attention histogram')
plt.savefig(os.path.join(results_dir,out_file+'_attention_hist.pdf'))
plt.show()

plt.hist(SD, bins=80)
plt.xlabel('Position of the sentence in documents')
plt.ylabel('Frequency')
plt.title('Standard deviation of attention histogram')
plt.savefig(os.path.join(results_dir,out_file+'_std_attention_hist.pdf'))
plt.show()
'''

plt.scatter(x=SD, y=MAX,  label = 'Values of highest attentions')
plt.title('Relation of highest attention and standard deviation')
plt.xlabel('Standard deviation of \n attentions in documents')
plt.ylabel('Highest attentions in documents')
plt.savefig(os.path.join(results_dir,out_file+'_max_vs_std.pdf'), bbox_inches='tight')

#plt.figure(num=None, figsize=(3, 2), dpi=80, facecolor='w', edgecolor='k')
plt.scatter(x=POS,y=SD,c="red", s=0.5)
#plt.hist(POS, bins=80, density=True)
sns.kdeplot(POS, bw=1, label = 'Density of highest attentions')
plt.title('Highest attentions versus standard deviation')
plt.xlabel('Position of the sentences \n with highest attentions in documents')
plt.ylabel('Standard deviation of \n attentions in documents')
plt.savefig(os.path.join(results_dir,out_file+'_std_attention_hist.pdf'), bbox_inches='tight')

''' 
# moins laborieux mais ne fonctionne pas
def maxfun(x):
    np.where(x==max(x))

attention_sentence.ravel().shape
maxfun(attention_sentence)

attention_sentence.apply_along_axis(maxfun,axis=0)
'''

# print attention and text for 1 exemple:
attention_sentence=predict_sentence_attention(han_model, X)

ATT_SENT=pd.DataFrame(attention_sentence[:,:len(sentences)].T)
ATT_SENT=ATT_SENT.assign(sentences=sentences)
ATT_SENT.shape
print(ATT_SENT)

plt.figure(0)
ax= plt.subplot()
sns_plot=sns.heatmap(attention_sentence[:,:len(sentences)].T, annot=False, ax = ax,cmap="GnBu",cbar =True)
fig = sns_plot.get_figure()
plt.savefig(os.path.join(results_dir,out_file+'_1example_attention.pdf'), bbox_inches='tight')


###############################
# return word attentions

# doesn't work:
att_layer = han_model.get_layer('word_attention')
prev_tensor = att_layer.input
dummy_layer = Lambda(
        lambda x: att_layer._get_attention_weights(x)
    )(prev_tensor)
word_attention=Model(han_model.input, dummy_layer).predict(X)

word_attention.shape

word_attention==attention_sentence ## strange!

### difficult to obtain good shapes 
get_attention_word = K.function([han_model.layers[0].input, K.learning_phase()],
                                  [han_model.layers[2].output])
sentences[10]
x_sent=tokenized_sentences[10]
# output in test mode = 0
get_attention_word_test = get_attention_word([X, 0])[0]

get_attention_word_test.shape
get_attention_word_test[0,10,:] # shape of embedding

plt.figure(0)
ax= plt.subplot()
sns_plot=sns.heatmap(get_attention_word_test, annot=False, ax = ax,cmap="YlGnBu",cbar =True)
fig = sns_plot.get_figure()
