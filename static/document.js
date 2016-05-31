$(document).ready(function () {
      var editor ;
     $("#edit-content").click(function(){
          var title = $("#dtitle span").text();
          var content = $("#dcontent").html();
          editor = UE.getEditor('econtent');
          editor.addListener("ready", function () {            
                editor.setContent(content+"",true);
          });
          $('#etitle input').val(title+"")
          $('#docinfo').hide()
          $('#editinfo').show();
          $('#tagdetail').show()
      });

     $("#delete-content").click(function(){
          var docid = $("#dtitle").attr('docid');
          post_data = "docid=";
          post_data += encodeURIComponent(docid);
          $.ajax({type:'post',url:"/delete/document",data:post_data.toString(),cache:false,success:function(data){
                      $('.button').attr('disabled',"true")               
                	window.location.href ="/"
          }});
     });
     $("#save-modify").click(function(){ 

          var textcontent = editor.getContentTxt().toString();
          var html = editor.getContent();
          var title = $("#etitle input").val();
          var docid = $("#dtitle").attr('docid');
          var category = $("#eclassify").attr('index')
          var post_data = "textcontent=";
          post_data += encodeURIComponent(textcontent)
          post_data += "&html=";
          post_data += encodeURIComponent(html);
          post_data += "&docid=";
          post_data += encodeURIComponent(docid);
          post_data += "&title=";
          post_data += encodeURIComponent(title);
          post_data += "&category=";
          post_data += encodeURIComponent(category);

          $.ajax({type:'post',url:"/modify/document",data:post_data.toString(),cache:false,success:function(data){                
                $('.button').attr('disabled',"true")
                // $('#save-modify').remove("disabled")
                window.location.href ="/document/" + docid;
          }});
     });
     $("#gave-up-modify").click(function(){
          $('#docinfo').show();
          $('#editinfo').hide();
          $('#tagdetail').hide();
     });
});
