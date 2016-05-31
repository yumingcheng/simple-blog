$(document).ready(function () {

     var editor = UE.getEditor('econtent');
     $("#save-insert").click(function(){
          var textcontent = editor.getContentTxt().toString();
          var html = editor.getContent();
          var title  = $("#etitle input").val();
          var category = $("#eclassify").attr('index')
          var post_data = "textcontent=";
          post_data += encodeURIComponent(textcontent);
          post_data += "&html=";
          post_data += encodeURIComponent(html);
          post_data += "&title=";
          post_data += encodeURIComponent(title);   
          post_data += "&category=";
          post_data += encodeURIComponent(category);  
          $.ajax({type:'post',url:"/insert/document",data:post_data,cache:false,success:function(data){
          if(data == '0')
          {
              alert('save error!')
          }
          else{
            
              window.location.href ="/document/" + data;
          }

          }});
     });
     $("#gave-up-insert").click(function(){
          window.location.href = "/"    
     });

});