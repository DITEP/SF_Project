from controllers.pred import pred
def compute(text):
    try:
        (result, sentences,sentence_attentions,word_attentions) = pred(text)
        #data is given back as part of a list of one element that we need to extract
        #We're also converting data into list for use in JSON
        result = float(result)
        sentence_attentions = sentence_attentions[0].tolist()
        word_attentions = word_attentions[0].tolist()
        return (result, sentences,sentence_attentions,word_attentions)
    except Exception as error:
        print("Unexpected Error: {}".format(error))
        return "Unexpected Error: {}".format(error)

res = {}
(res['result'], res['sentences'], res['sentence_attentions'],res['word_attentions']) = compute("test. this is a test")
print(res['sentences'])
