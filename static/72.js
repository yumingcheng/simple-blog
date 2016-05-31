showTime();
          
        function showTime(){                                  
               var today = new Date();  
               var weekday=new Array(7)  
               weekday[0]="星期一"  
               weekday[1]="星期二"  
               weekday[2]="星期三"  
               weekday[3]="星期四"  
               weekday[4]="星期五"  
               weekday[5]="星期六"  
               weekday[6]="星期日"                                          
               var y=today.getFullYear()+"年";  
               var month=today.getMonth()+"月";  
               var td=today.getDate()+"日";  
               var d=weekday[today.getDay()];  
               var h=today.getHours();  
               var m=today.getMinutes();  
               var s=today.getSeconds();          
         
               $("#shi").rotate((parseInt(h) + parseInt(m)/60.0 -12)*30); 

               $("#fen").rotate(parseInt(m)*6+parseInt(s)*0.1);
               $("#miao").rotate(parseInt(s)*6);
        }          
setInterval(showTime, 1000); 


$('#img1').rotate({angle:45});

$("#img2").rotate({ 
   bind: 
     { 
        mouseover : function() { 
            $(this).rotate({animateTo:180});
        },
        mouseout : function() { 
            $(this).rotate({animateTo:0});
        }
     } 
   
});


var angle = 0;
setInterval(function(){
      angle+=3;
     $("#img3").rotate(angle);
},50);


var rotation = function (){
   $("#img4").rotate({
      angle:0, 
      animateTo:360, 
      callback: rotation
   });
}
rotation();



var rotation2 = function (){
   $("#img5").rotate({
      angle:0, 
      animateTo:360, 
      callback: rotation2,
      easing: function (x,t,b,c,d){        // t: current time, b: begInnIng value, c: change In value, d: duration
          return c*(t/d)+b;
      }
   });
}
rotation2();


$("#img6").rotate({ 
   bind: 
     { 
        click: function(){
            $(this).rotate({ angle:0,animateTo:180,easing: $.easing.easeInOutExpo })
        }
     } 
   
});


var value2 = 0
$("#img7").rotate({ 
   bind: 
     { 
        click: function(){
            value2 +=90;
            $(this).rotate({ animateTo:value2})
        }
     } 
   
});