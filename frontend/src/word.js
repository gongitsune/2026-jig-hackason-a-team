import { API } from "./api.js";

var target = "世界一強い武器";

addRoomStatusListener((updatedStatus) => {
  if (updatedStatus.status === "") {
    window.location.href = "/sentence.html";
  }
});

var target_text = document.getElementById("target");
target_text.textContent = target;

var words= document.getElementsByClassName("card");
var input_word= document.getElementById("word-textarea");
var button= document.getElementById("submit-button");
button.onclick=submit_word;

function submit_word(){
  if(input_word.value === ""){
    alert("入力を行ってください");
    return;
  }
  for(var i = 0;i < words.length;i++){
    var child = words[i].children[0];
    if(child.className === "preword-0"){
      child.className = "preword-1";
      child.textContent = input_word.value;
      input_word.value = "";
      if(i < words.length - 1)return;
    }else if(child.textContent === input_word.value){
      input_word.value = "";
      alert("単語が被っています");
      return;
    }
  }
  submit();
  return;
}

function submit(){
  API.postWords(words[0].textContent);
}