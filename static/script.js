function copyText(){

let text = document.getElementById("translatedText").innerText;

navigator.clipboard.writeText(text);

alert("Copied!");

}


function showLoader(){

document.getElementById("loader").style.display="block";

}