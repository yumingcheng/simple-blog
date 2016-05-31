//顶部菜单弹出代码
var timeout         = 0;
var closetimer      = 0;
var ddmenuitem      = 0;
// open hidden layer
function mopen(id)
{   
    // cancel close timer
    mcancelclosetime();

    // close old layer
    if(ddmenuitem) ddmenuitem.style.visibility = 'hidden';

    // get new layer and show it
    ddmenuitem = document.getElementById(id);
    ddmenuitem.style.visibility = 'visible';

}
// close showed layer
function mclose()
{
    if(ddmenuitem) ddmenuitem.style.visibility = 'hidden';
}
// go close timer
function mclosetime()
{
    closetimer = window.setTimeout(mclose, timeout);
}
// cancel close timer
function mcancelclosetime()
{
    if(closetimer)
    {
        window.clearTimeout(closetimer);
        closetimer = null;
    }
}
// close layer when click-out
document.onclick = mclose; 

//搜索补全代码
$.widget( "custom.catcomplete", $.ui.autocomplete, {
    _create: function() {
      this._super();
      this.widget().menu( "option", "items", "> :not(.ui-autocomplete-category)" );
    },
    _renderMenu: function( ul, items ) {
      var that = this,
      currentCategory = "";
      $.each( items, function( index, item ) {
        var li;
        if ( item[0] != currentCategory ) {
          var cateStr 
          if(item[0] == "people")
            cateStr = "用户";
          else if(item[0] == "book")
            cateStr = "书籍小说"
          else if(item[0] == "question")
            cateStr = "问题"
          else if(item[0] == "keyword")
            cateStr = "提示词"
          ul.append( "<li class='ui-autocomplete-category'>" + cateStr + "</li>" );
          currentCategory = item[0];
        }
        var h_li = $("<li>");
        li =  h_li.appendTo( ul ).data( "ui-autocomplete-item", item )

        if(currentCategory == "people")
        {
            // $("<a href='/people/"+item[3]+"' class = 'plink'><img src='"+item[2]+"' alt='头像'><span class='pname'>"+item[1]+"</span><br><span class ='psign'>"+item[4]+"</span></a>").appendTo(h_li);
             $("<a href='/people/"+item[3]+"' class = 'plink'><img src='"+item[2]+"' alt='头像'><span class='pname'>"+item[1]+"</span><span class ='psign'>"+item[4]+"</span></a>").appendTo(h_li);

        }else if(currentCategory == "question")
        {
            $("<a href='/question/"+item[3]+"' class='qlink'><span>"+item[1]+"</span></a>").appendTo(h_li);         

        }else if(currentCategory == "book")
        {
            $("<a href='/book/"+item[1]+"' class='blink'><span>《</span><span class='bname'>"+item[2]+"</span><span>》</span></a>").appendTo(h_li);

        }else if(currentCategory == "keyword")
        {
            $("<span>"+item[1]+"</span>").appendTo(h_li);
        }
        if ( item[0] ) {
          li.attr( "ye-"+currentCategory, item[0] + " : " + item[1] );
        }
      });
    }
});


$(function() {

    $( ".top_main_menu" ).menu({position: {at: "left bottom"}, icons: { submenu: "ui-icon-blank" } });

    $( "#top_center .top_serach .searchinfo .keyword" ).catcomplete({
      source: function( request, response ) {
        $.ajax({
          url: "/suggest/s",
          dataType: "json",
          data: {
            sw: request.term
          },
          success: function( data ) {
            response( data );
          }
        });
      },
      minLength: 1,
      select: function( event, ui ) {
            var link = ""
            if(ui.item[0] == "people")
            {
                link = "/people/"+ui.item[3]
            }else if(ui.item[0] == "question")
            {
                link = "/question/"+ui.item[3]

            }else if(ui.item[0] == "book")
            {
                link = "/book/"+ui.item[1]

            }else if(ui.item[0] == "keyword")
            {
                link = "/keyword/s?"+"wq="+ui.item[0]
            }
            window.location.href = link
      },
      open: function() {
        $( this ).removeClass( "ui-corner-all" ).addClass( "ui-corner-top" );
      },
      close: function() {
        $( this ).removeClass( "ui-corner-top" ).addClass( "ui-corner-all" );
      }
    });
});

//内容侧边框折叠代码
function removeAllChild(id)
{

    var div = document.getElementById(id);
    while(div.hasChildNodes()) //当div下还存在子节点时 循环继续
    {
        div.removeChild(div.firstChild);
    }
}

$(document).ready(function () {

    var jsonNow ="";
    function getServerDate(ftype,furl,fdata){
          $.ajax({type:ftype,url:furl,data:fdata,cache:false,dataType:'json',success:function(data){   
                removeAllChild("listcontent");                
                if(data['ret'] == 0){
                      // alert($('#forMore').attr('page'))
                      $('#forMore').attr('page',data['nextpage'])
                      // alert(data['info'])
                      $(data['info']).appendTo($('#listcontent'))
                }else{
                   alert('load error !')
                }
          }});
               
    }
  

    var aMenuOneLi = $(".menu-one > li");
    var aMenuTwo = $(".menu-two");
    $(".menu-one > li > .header").each(function (i) {
        $(this).click(function () {
            if ($(aMenuTwo[i]).css("display") == "block") {
                $(aMenuTwo[i]).slideUp(300);
                $(aMenuOneLi[i]).removeClass("menu-show")
            }
            else if($(aMenuTwo[i]).attr('detail') == 'document'){
                for (var j = 0; j < aMenuTwo.length; j++) {
                    $(aMenuTwo[j]).slideUp(300);
                    $(aMenuOneLi[j]).removeClass("menu-show");
                }
                $(aMenuTwo[i]).slideDown(300);
                $(aMenuOneLi[i]).addClass("menu-show")
                $('#gtit').text('我的文章');
            }
            else
            {
                for (var j = 0; j < aMenuTwo.length; j++) {
                    $(aMenuOneLi[j]).removeClass("menu-show");
                }
                $(aMenuOneLi[i]).addClass("menu-show")
                if($(this).attr('type') == 'hot_doc')
                {
                    $('#gtit').text('热点文章推荐');

                    ftype = 'post'
                    furl = '/rcmd/document'
                    fdata = 'page=0'
                    getServerDate(ftype,furl,fdata)

                }else if($(this).attr('type') == 'hot_author')
                {
                    $('#gtit').text('热点作者推荐');

                }else if($(this).attr('type') == 'my_doc')
                {
                    $('#gtit').text('我的文章');

                }else if($(this).attr('type') == 'my_collect_doc')
                {
                    $('#gtit').text('我收藏的文章');

                }else if($(this).attr('type') == 'my_follow_author')
                {
                    $('#gtit').text('我关注的作者');

                }else if($(this).attr('type') == 'insert_new_doc')
                {
                      window.location.href ="/insert/document";
                }
            }
        });
    });

    $(".menu-two[detail='document'] .select").each(function (i) {
        $(this).click(function () {
            var ftype = 'post';
            var furl = '/category/document';
            var fdata = "category=" + $(this).attr("index")
            fdata += "&page=0" ;
            getServerDate(ftype,furl,fdata);
        });
    });

   $("#forMore").click(function(){ 

        var ftype = 'post';
        var furl = '/rcmd/document';
        var fdata = 'page=';
        if( $(this).attr('type') == 'hot_doc')
        {
              fdata = fdata+$('#forMore').attr('page')
              furl  = '/rcmd/document'

        }
        else if($(this).attr('type') == 'hot_author')
        {

        }
        else if($(this).attr('type') == 'my_doc')
        {
        
        }
        else if($(this).attr('type') == 'my_collect_doc')
        {

        }
        else if($(this).attr('type') == 'my_follow_author')
        {

        }else if($(this).attr('type') == 'insert_new_doc')
        {
             window.location.href ="/insert/document/";
        }
        $.ajax({type:ftype,url:furl,data:fdata,cache:false,dataType:'json',success:function(data){
                if(data['ret'] == 0){

                      $('#forMore').attr('page',data['nextpage'])
                      $(data['info']).appendTo($('#listcontent'))
                      if(data['hasnext'] == 0)
                          $('#forMore').css('display','none')
                }
                else{
                      alert('load error !')
                }
        }});
   });

     $(".classify-one .header .arrow").click(function(){
             $('#enewClassify').css("display",'block')
             $('#enewClassify #ebg').css("height",$(document).height())
             $('#enewClassify #dialogContent').css("left",$(document).width()/2- $('#dialogContent').width()/2)
             $('#enewClassify #dialogContent').css("top",$(window).height()/2- $('#dialogContent').height()/2)
     });

     $('#cls-Save').click(function(){
              if($('#digName').val().length > 100)
                    $('#enewClassify #dialogContent .derror').css("visibility",'visible')
              else
              {
                    var post_data = "category=";
                    post_data += encodeURIComponent($('#digName').val());
                    $.ajax({type:'post',url:"/insert/category",data:post_data,cache:false,success:function(data){
                           if(data == '0')
                           {
                                alert('save error!')
                           }
                           else{    

                                $('<li class= "select" index = "'+data+'" alt="'+$('#digName').val()+'" title="'+$('#digName').val()+'"><span class="ctitle">'+$('#digName').val()+'</span><span class="cnum">(0)</span></li>').appendTo($(".classify-two"))
                                $('#enewClassify').css("display",'none')
                                $("#digName").val("");
                                $(".classify-one .select").each(function (i) {
                                     $(this).on("click",function () {

                                        $('#eclassify span').text($(this).attr("title")) 
                                        $('#eclassify').attr("index",$(this).attr("index")) 
                                      });
                                });
                           }
                    }});

              }
     });

     $('#cls-Cancel').click(function(){
          $('#enewClassify').css("display",'none')
          $("#digName").val("");
     });

    var ClOneLi = $(".classify-one > li");
    var ClTwo = $(".classify-two");
    $(".classify-one > li > .header span").each(function (i) {
          $(this).on('click',function () {

            if ($(ClTwo[i]).css("display") == "block") {
                $(ClTwo[i]).slideUp(300);
                $(ClOneLi[i]).removeClass("classify-show")
            }
            else {

                for (var j = 0; j < ClTwo.length; j++) {
                    $(ClTwo[j]).slideUp(300);
                    $(ClOneLi[j]).removeClass("classify-show");
                }
                $(ClTwo[i]).slideDown(300);
                $(ClOneLi[i]).addClass("classify-show")
            }
         });
    });

    $(".classify-one .select").each(function (i) {
        $(this).on("click",function () {
            $('#eclassify span').text($(this).attr("title")) 
            $('#eclassify').attr("index",$(this).attr("index")) 
        });
    });

});

