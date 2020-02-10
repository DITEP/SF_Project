function openFile(event) {
	var reader = new FileReader();
	reader.readAsText((event.target).files[0]);
    reader.onload = function() {

		 $("#t1").val(reader.result);
    };
	return false;
};

// La fonction fade_out permet de faire disparaitre un élément à partir de son id.
function fade_out(id) {
	to_remove = document.getElementById(id)
	to_remove.parentNode.removeChild(to_remove);
	return false;
}


// La fonction fade_out_children fait disparaitre tous les enfants de la div id.
function fade_out_children(id){
	parent = document.getElementById(id);
	while(parent.firstChild){
		parent.removeChild(parent.firstChild)
	}
	return false
}

// La fonction custom_alert permet de lancer une alerte qui sera contenue dans la div id_wrapper,
//avec le message message
function custom_alert(message,id_wrapper) {
	var alert = document.createElement('div');
	alert.classList.add('alert');
	alert.classList.add('alert-primary');
	alert.id = 'custom-alert';
	alert.innerHTML = message;
	var wrapper = document.getElementById(id_wrapper);
	document.body.appendChild(alert, wrapper);
	return false;
};


//top_n prend en entrée un array et renvoie un array contenant ses n premiers elements
function top_n(array,n){
	if (n>array.length) {
		return "Error : n is bigger than array size"
	}
	var sorted = Array.from(array);
	sorted.sort(function(a, b){return b - a});
  const quart = Math.floor(sorted.length / 4);
  return {limit : sorted[quart], n_first : sorted.slice(0,n)}
}


//heat_color retourne une couleur pour la heat map des attentions en fonction de la valeur de l'attention
function heat_color(value){
	var l = Math.max((0.95 - 4*value),0.54) * 100;
	return "hsl(20, 88.9%," + l + "%)"
}


function word_heat_color(value){
	var l = Math.max((0.95 - 4*value),0.54) * 100;
	return "hsl(195, 88.9%," + l + "%)"
}


//attention créé la visualisation de l'attention dans la balise ol ol_id, à partir de l'ensemble des token et des attentions associées.
function attention(ol_id,sentences,sentence_attentions,word_attentions){
	var ol = document.getElementById(ol_id);
	var top_attentions = top_n(sentence_attentions,3).n_first;
  var limit_attention = top_n(sentence_attentions,3).limit;
  console.log(limit_attention);
	for (var i = 0; i<sentences.length; i++){
		var words,start_to_color;
    words = sentences[i].split(' ');

		//Variables to handle the pre padding of the text. start_to_color serves when
		//sentence has more words than the max number of words per sentence for the algorithm.
		//Because the algorithm only reads the last words in that case, we only have attentions value for them.
		//attention_start serves if the sentence has less words than the maximum number. Because it is
		//pre padded, attention for the words are located at the end of the word_attentions array.
		start_to_color = Math.max(0,words.length-word_attentions[i].length);
		attention_start = Math.max(0,word_attentions[i].length-words.length);
   
    do_color = sentence_attentions[i]>Math.max(limit_attention,0.01);
  
   
   


		//Création des contenants
		var li = document.createElement('li');
		var row = document.createElement('div');
		row.classList.add('row');


		//Disposition des tokens (phrases ici)
		var sentence = document.createElement('div');
		sentence.classList.add('col-7');
		for (var j = 0; j<words.length; j++){
			var word = document.createElement('span')
			word.innerHTML = words[j] + ' ';
		  if (j >= start_to_color && do_color){
			  word.style['background-color'] = word_heat_color(word_attentions[i][attention_start + j - start_to_color]);
		  }
			sentence.appendChild(word);
		}
		if (sentence_attentions[i]>0.1 || top_attentions.includes(sentence_attentions[i])) {
			sentence.style['color'] = '#f26722';
     
		}
		sentence.style['margin']= 'auto';

		//Ajout d'un point pour signaler le lien entre texte et valeur de l'attention
		var point = document.createElement('span');
		point.classList.add('dot');

		//Disposition des couleurs et valeur d'attention
		var heat = document.createElement('div');
		heat.classList.add('col-4');
		heat.classList.add('heat');
		heat.style['background-image'] = 'linear-gradient(to left, white, ' + heat_color(sentence_attentions[i]) + ')';
		heat.innerHTML = Math.round(sentence_attentions[i]*10000)/10000;


		//Ils sont tous enfants de la div row que l'on va insérer dans la liste
		row.appendChild(sentence);
		row.appendChild(point)
		row.appendChild(heat);

		li.appendChild(row);
		ol.appendChild(li);
	}
	return false
}


//function for the submit query
$(document).ready(function() {
	document.getElementById('submit').addEventListener('click', function() {
		text = document.getElementById('t1').value;
		if (text != "") {
			//Ask user additional information about the report
			dateCr = prompt('Please insert date of report with format YYYY-MM-DD','YYYY-MM-DD')
			dateInc = "2019-10-08" //Ajouter case meme date
			nip = prompt('Please insert NIP of patient','111111111-AA')
			//display loading
			fade_out_children('attention-container');
			document.getElementById("loader-container").style.display = "inline";

			//Avoid multiple submit request
			document.getElementById('submit').disabled = true;




			//preparing data to send
			data = {"text":text,"dateCr":dateCr,"dateInc":dateInc,"nip":nip};
			data = JSON.stringify(data);
			//request
			$.ajax({
					type: 'POST',
					url: "/pred",
					data: data,
					contentType: "application/json;charset=utf-8",
					dataType: 'json',
					success: function(response){
						res = response["result"];
						sentences = response["sentences"];
						sentence_attentions = response["sentence_attentions"];
						word_attentions = response["word_attentions"];
						// la fonction attention créé la représenation des attention dans la list choisie
						attention('attention-container',sentences,sentence_attentions,word_attentions);

						//On ecrit le résultat dans la div result
						document.getElementById('result').innerHTML = res;
						//On arrête de display le loading
						document.getElementById("loader-container").style.display = "none";
						//La requête étant terminée, on autorise à en faire de nouvelles
						document.getElementById('submit').disabled = false;
						//Custom alert génère une alerte personnalisé dans la div de son choix (ici top-text)
						custom_alert('Prediction complete !','top-text');
						setTimeout(function(){
							fade_out('custom-alert');
						},3000)
					}
				});
		}
		return false;
	});
})

// Script for clear button
function clearById(id){
	document.getElementById(id).value = ''
}

$(function(){
	document.getElementById('clear').addEventListener("click",function(){
		clearById('t1');
	}, false);
})
