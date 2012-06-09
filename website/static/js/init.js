var map;
var overlay;
var projection;
var markerClusterer;
var lineClusterer;
var stoped=true;

var drawcircle_data=[];     //获取转发状态信息,用以画点
var drawline_data = [];     //用于画线的信息
var distinct_time = [];     //数据时间分割点数组

function getUrlParam(name) { 
	var reg = new RegExp("(^|&)" + name + "=([^&]*)(&|$)"); 
	var r = window.location.search.substr(1).match(reg); 
	if (r != null){ 
		return decodeURI(r[2]); 
	}
	return null; 
} 

/*
console.log(getUrlParam('topic'));
console.log(getUrlParam('starttime'));
console.log(getUrlParam('endtime'));
console.log(getUrlParam('timeInterval'));
*/

var mapWeibo = {
	getPresentTopic: getUrlParam('topic'),
	step_sum : getUrlParam('timeInterval'),       //规定slider的步数总和
	now_step : 0,

	inter_slider : null,
	interval_time : 5000,
    initialOptions : {
        zoom : 4,
		minZoom : 3,
        center: new google.maps.LatLng(35.563611,103.36388611),
        mapTypeId: google.maps.MapTypeId.ROADMAP,//SATELLITE,
        navigationControlOptions : {
            style: google.maps.NavigationControlStyle.ZOOM_PAN,
            position: google.maps.ControlPosition.TOP_LEFT
        },
        mapTypeControlOptions : {
            style : google.maps.MapTypeControlStyle.DROPDOWN_MENU,
            position: google.maps.ControlPosition.TOP_RIGHT
        },
		overviewMapControl : true,
		overviewMapControlOptions : {
			opened : true,
		},
		panControl : true,
		panControlOptions : {
			position : google.maps.ControlPosition.TOP_LEFT,
		},
		rotateControl : true,
		rotateControlOptions : {
			position: google.maps.ControlPosition.TOP_CENTER, 
		}
    },
    reset : function () {
        map.panTo(mapWeibo.initialOptions.center);
        map.setZoom(mapWeibo.initialOptions.zoom);
    },    
    markerIcons: {
        fipost : {
            '1' : ['/static/images/map/markers/fipost/1.png'],
            '2' : ['/static/images/map/markers/fipost/2.png'],
            '3' : ['/static/images/map/markers/fipost/3.png']
        },
		equalpost : {
            '1' : ['/static/images/map/markers/equalpost/1.png'],
            '2' : ['/static/images/map/markers/equalpost/2.png'],
            '3' : ['/static/images/map/markers/equalpost/3.png']
        },
        repost : {
            '1': ['/static/images/map/markers/repost/1.png'],
            '2': ['/static/images/map/markers/repost/2.png'],
            '3': ['/static/images/map/markers/repost/3.png']
        },
    },
    markersByCategory : {
        fipost : [],
		equalpost: [],
        repost : []
    },
	clearMarkersByCategory : function (category) {
		mapWeibo.markersByCategory['fipost'] = [];
		mapWeibo.markersByCategory['equalpost'] = [];
		mapWeibo.markersByCategory['repost'] = [];
	},
    showMarkersByCategory : function (category) {
        for (var k=0; k<mapWeibo.markersByCategory[category].length; k+=1) {
			var thisMarker = mapWeibo.markersByCategory[category][k];
            mapWeibo.markersByCategory[category][k].setVisible(true);
			markerClusterer.addMarker(thisMarker);
        }
		markerClusterer.resetViewport();
        markerClusterer.redraw();
    },
    hideMarkersByCategory : function (category) {
        for (var i=0; i<mapWeibo.markersByCategory[category].length; i+=1) {
            var thisMarker = mapWeibo.markersByCategory[category][i];
            thisMarker.setVisible(false);
            markerClusterer.removeMarker(thisMarker);
        }
        markerClusterer.resetViewport();
        markerClusterer.redraw();
    },
};

var DOM = {
    tooltip : {
        inDOM : false,
        isHidden : false,
        append : function (element, content) {
            if (!this.inDOM && !this.isHidden) {
                var HTMLTooltip = '<div id="tooltip"><div class="inner">' + content + '</div></div>';
                $('body').append(HTMLTooltip);
                $('#tooltip').css({
                    top: $(element).offset().top - 47 + 'px'
                });
                this.move(element);
                this.inDOM = true;
                this.isHidden = false;
            }
        },
        hide : function () {
            if (!this.isHidden) {
                $('#tooltip').addClass('hidden');
                this.isHidden = true;
            }
        },
        move : function (element) {
            $(element).bind('mousemove', function(e){
                if (e.pageX + $('#tooltip').width()/2 < $(window).width() && e.pageX - $('#tooltip').width()/2 > 0) {
                    $('#tooltip').css({
                        left: e.pageX - ($('#tooltip').width() / 2) + 'px'
                    });
                }
            });
        },
        remove : function (element) {
            this.stop();
            $('#tooltip').remove();            
            this.inDOM = false;
            this.isHidden = false;
        },
        stop : function (element) {
            $(element).unbind('mousemove');
        }
    },
    data : [
        {
            element : '#console #categories',
            key : 'hint',
            value : 'Active category is shown on the map'
        }
    ],
	ui : function(){
		return{
			init : function () {
				map = new google.maps.Map(document.getElementById('map_canvas'), mapWeibo.initialOptions);
							
				$('#slider').slider({
									   min: 0,
									   //max: mapWeibo.step_sum + 8,
									   step: 1,
									 });
				$('#play_pause1').button({icons: {primary: "ui-icon-play"},text: false});
				$('#play_pause2').button({icons: {primary: "ui-icon-pause"},text: false});
				$('#play_pause3').button({icons: {primary: "ui-icon-bullet"},text: false});
				
				var layout_body=$('body').layout({ applyDefaultStyles: true,resizable: false});
				layout_body.sizePane("west", 200);
				layout_body.sizePane("south", 75);
				layout_body.sizePane("north",34);
						
			}
		}
	}(),
	nationViewButton : function () {
        var htmlElement = '<p id="back-to-nation-view" class="hidden"><span>Back to nation view</span></p>';
        var $element;
        return {
            init : function () {
				$element = $('body').append(htmlElement).find('#back-to-nation-view');
                $element.bind('click', function () {
                    mapWeibo.reset();
                });
				//$element.addClass('hidden');
				$element.removeClass('hidden');
            },
            hide : function () {
                $element.addClass('hidden');
            },
            show : function () {
                $element.removeClass('hidden');
            }
        };
    }(),
	
    init : function () {
	    DOM.nationViewButton.init();
		DOM.ui.init();
        
		
        $('#console ul li').addClass('active').bind('click', infoWindow.close);
        $(window).bind('resize', function () {
            infoWindow.close();
        });

          $('#console #helpers li#all').bind('click', function () {
		  if(stoped == true){
			var $liAll = $(this);
            if ( !$liAll.hasClass('active') ) {
                $('#console #categories li:not(.active)').each(function () {
                    mapWeibo.showMarkersByCategory( $(this).addClass('active').attr('id') );
                });
                $liAll.addClass('active');
				$('#slider').slider("option", "disabled", false);
				$('#play_pause1').button("option", "disabled", false);
				$('#play_pause2').button("option", "disabled", false);
				$('#play_pause3').button("option", "disabled", false);
            }
		  }
        });

        $('#console #categories li').bind('click', function () {
		   if(stoped == true){
            var $li = $(this);
            var $liAll = $('#console #helpers li#all');
            if ( $liAll.hasClass('active') ) {
                $li.siblings('li').each(function () {
                    mapWeibo.hideMarkersByCategory( $(this).removeClass('active').attr('id') );
                });
                $liAll.removeClass('active');
				$('#slider').slider("option", "disabled", true);
				$('#play_pause1').button("option", "disabled", true);
				$('#play_pause2').button("option", "disabled", true);
				$('#play_pause3').button("option", "disabled", true);
            } else if ( !$li.hasClass('active') ) {
                mapWeibo.hideMarkersByCategory( $li.siblings('li.active').removeClass('active').attr('id') );
                mapWeibo.showMarkersByCategory( $li.addClass('active').attr('id') );
				$('#slider').slider("option", "disabled", true);
				$('#play_pause1').button("option", "disabled", true);
				$('#play_pause2').button("option", "disabled", true);
				$('#play_pause3').button("option", "disabled", true);
            }
		   }
        });

       
        
       
        for (var i=0; i<DOM.data.length; i+=1) {
				var d = DOM.data[i];
				$(d.element).data(d.key, d.value);
	
				$(d.element).bind('mouseenter', function(){
				   if(stoped == true){
						DOM.tooltip.append(this, $(this).data('hint'));
				   }
				   else{
					   DOM.tooltip.append(this, 'Please pause the slider before active the category on the map');
				   }
				   
				});
	
				$(d.element).bind('click', function(){
					if(stoped == true){
						DOM.tooltip.hide();
					}
				});
	
				$(d.element).bind('mouseleave', function(){
					DOM.tooltip.remove(d.element);
				});
			
        }
    }
};

function dataHandle(dt_weibo_spread){
	 /*
	  *对上面处理后的dt_weibo进行再处理
	  *得到画圆的数据和画线的数据
	  */
	  function getUnique(someArray){           //得到一个元素互异的数组
		   tempArray=someArray.slice(0);//复制数组到临时数组
		   for(var i=0;i<tempArray.length;i++){
				 for(var j=i+1;j<tempArray.length;){
					 if(tempArray[j]==tempArray[i]){
						 //后面的元素若和待比较的相同，则删除并计数；
						 //删除后，后面的元素会自动提前，所以指针j不移动
							tempArray.splice(j,1);
					  }
					 else{
							j = j + 1;
					  }					  
						//不同，则指针移动				 
				  }
		   }
		   return tempArray;
	  }	 
			
	  var time_array=[];
				
	  for(var x = 0;x < dt_weibo_spread.length;x = x + 1){
		  time_array.push(dt_weibo_spread[x].release_time);
	  } 
	  var primary_distinct_time = getUnique(time_array);//互异的时间数组，且从小到大排序
	  /*
	  function getPresentHour(date){
		  var da = new Date(date.getFullYear(),date.getMonth()+1,date.getDate()+1,date.getHours()+1,0,0);
		  console.log(da.toString());
		  var time = da.getTime();
		  return time;
	  }
	  			
	  var primary_distinct_time = getUnique(time_array);//互异的时间数组，且从小到大排序	
	  var da_begin = new Date(primary_distinct_time[0]*1000);
	  var time_begin = getPresentHour(da_begin);
	  console.log('time_begin' + time_begin);
	  
	  var da_end = new Date((primary_distinct_time[primary_distinct_time.length-1]+60*60*24)*1000);
	  var time_end = getPresentHour(da_end);
	  console.log('time_end' + time_end);
	  //获得时间分割点数组distinct_time
	  
	  var time_length = Math.round((time_end - time_begin)/(60*60*24*1000));
	  console.log('time_length' + time_length);
	  var t_step = 0;
	  for(var x = 0;x < time_length;x = x + 1){
		  
		  distinct_time.push(time_begin + t_step);
		  t_step = t_step + 60*60*24*1000;
	  }
	  */
	  			
	  var each_step_index = Math.floor(primary_distinct_time.length / mapWeibo.step_sum);
										  
	  var index = 0;                                    //index是时间分割点索引
	  //获得时间分割点数组distinct_time
	  while(index <=  primary_distinct_time.length-1){
		  if(index >= primary_distinct_time.length-1){
			  distinct_time.push(primary_distinct_time[primary_distinct_time.length-1]);
			  break;
		  }
		  if(index < primary_distinct_time.length-1){
			  if(index <= 8){
				  distinct_time.push(primary_distinct_time[4]);
				  index = 9
			  }
			  else{
				  distinct_time.push(primary_distinct_time[index]);
				  index = index + each_step_index;
			  }
		  }
	  }
	  
	  
	  mapWeibo.step_sum = distinct_time.length;			
	  $( "#slider" ).slider( "option", "max", mapWeibo.step_sum);
	  
	  //获得drawcircle_data数据
	  var latlng_array =[];
	  for(var x = 0;x < dt_weibo_spread.length;x = x + 1){
		  if(dt_weibo_spread[x].release_latlng != null && dt_weibo_spread[x].release_latlng != undefined){
			   latlng_array.push(dt_weibo_spread[x].release_latlng);
		  }
	  }
	  var distinct_latlng=getUnique(latlng_array);
	  
	  for(var x = 0,index = 0;x < distinct_time.length;x = x + 1){
		  for(var y = 0;y < distinct_latlng.length;y = y + 1){
			  var fipost = 0;
			  var repost = 0;
			  var have = false;
			  for(var z = 0;z < dt_weibo_spread.length;z = z + 1){
					if(dt_weibo_spread[z].release_time <= distinct_time[x] && dt_weibo_spread[z].release_latlng == distinct_latlng[y]){                                    
					    have = true;
						if(dt_weibo_spread[z].original == 0){
							  repost = repost + 1;
						}
						if(dt_weibo_spread[z].original == 1){
							  fipost = fipost + 1;
						}  
					}
			  }
			  if(have == true){
					drawcircle_data.push({release_time: distinct_time[x],
										release_latlng: distinct_latlng[y],
										fipost: fipost,
										repost: repost,
										status: '',
										id: index
												   });
					
					if(drawcircle_data[index].fipost > drawcircle_data[index].repost){
						drawcircle_data[index].status = 'fipost';
					}
					if(drawcircle_data[index].fipost ==drawcircle_data[index].repost){
						drawcircle_data[index].status = 'equalpost';
					}
					if(drawcircle_data[index].fipost < drawcircle_data[index].repost){
						drawcircle_data[index].status = 'repost';
					}
					index = index + 1
			  }
		  }
	  }
								
	  //处理得到drawline_circle的数据
	  var release_province_latlng_array = [];
	  var forward_province_latlng_array = [];
	  var temp_data = [];
	  for(var x = 0;x < dt_weibo_spread.length;x = x + 1){
		  if(dt_weibo_spread[x].original == 0){
			release_province_latlng_array.push(dt_weibo_spread[x].release_province_latlng);
			forward_province_latlng_array.push(dt_weibo_spread[x].forward_province_latlng);
		  }
	  }
				  
	  var distinct_release_province_latlng = getUnique(release_province_latlng_array);
	  var distinct_forward_province_latlng = getUnique(forward_province_latlng_array);
	  
	  var distinct_latlng_pair = [];
	  for(var x = 0;x < distinct_release_province_latlng.length;x = x + 1){
			  for(var y = 0;y < distinct_forward_province_latlng.length;y = y + 1){
				  if(distinct_release_province_latlng[x] != distinct_forward_province_latlng[y]){
					  distinct_latlng_pair.push({release_latlng: distinct_release_province_latlng[x],
												 forward_latlng: distinct_forward_province_latlng[y]									
												});
				  }
			  }
	  }
	 
	  for(var x = 0;x < distinct_latlng_pair.length;x = x + 1){
		  for(var y = 0;y < distinct_latlng_pair.length;y = y + 1){
			  if(x != y && distinct_latlng_pair[x] == distinct_latlng_pair[y]){
				  console.log('unsuccessful');
			  }
		  }
	  }
		
	  
	  
	   for(var y = 0;y < distinct_time.length;y = y + 1){
		   if(y == 0){
			   var time_array = [];
			   for(var x = 0;x < dt_weibo_spread.length;x = x + 1){
				   if(dt_weibo_spread[x].release_time <= distinct_time[0]){
					   time_array.push(dt_weibo_spread[x]);
				   }
			   }
			   
			  for(var z = 0;z < distinct_latlng_pair.length;z = z + 1){
					var repostnum = 0;
					for(var x = 0;x < time_array.length;x = x + 1){
						   if(time_array[x].release_province_latlng == distinct_latlng_pair[z].release_latlng && time_array[x].forward_province_latlng == distinct_latlng_pair[z].forward_latlng){
									  repostnum = repostnum +1;
							}	    
				   }
				   if(repostnum != 0){
									 temp_data.push({repost_time: distinct_time[y],
													 release_province_latlng: distinct_latlng_pair[z].release_latlng,
													 forward_province_latlng: distinct_latlng_pair[z].forward_latlng,
													 repost_num: repostnum
									 });
					}
					   
			  }
			}
			if(y != 0){
				   var time_array = [];
				   for(var x = 0;x < dt_weibo_spread.length;x = x + 1){
					   if(dt_weibo_spread[x].release_time <= distinct_time[y] && dt_weibo_spread[x].release_time > distinct_time[y-1]){
						   time_array.push(dt_weibo_spread[x]);
					   }
				   }
			   
				  for(var z = 0;z < distinct_latlng_pair.length;z = z + 1){
						var repostnum = 0;
						for(var x = 0;x < time_array.length;x = x + 1){
							   if(time_array[x].release_province_latlng == distinct_latlng_pair[z].release_latlng && time_array[x].forward_province_latlng == distinct_latlng_pair[z].forward_latlng){
										  repostnum = repostnum +1;
								}	    
					   }
					   if(repostnum != 0){
										 temp_data.push({repost_time: distinct_time[y],
														 release_province_latlng: distinct_latlng_pair[z].release_latlng,
														 forward_province_latlng: distinct_latlng_pair[z].forward_latlng,
														 repost_num: repostnum
										 });
						}
						   
				   }
			}
	  }
	  
	  //处理从A地到B地和从B地到A地的元素，归一
	  var handled = [];
	  Array.prototype.contains = function (element) {    
		  for (var i = 0; i < this.length; i++) {    
				if (this[i] == element) {    
	
					  return true;    
				}    
		  }    
		  return false;    
	  }   
	  
	  //令distinct_latlng_pair中从a到b 和从b到a是一个元素
	  for(var x = 0;x < distinct_latlng_pair.length;x = x + 1){
		  for(var y = 0;y < distinct_latlng_pair.length;y = y + 1){
			  if(distinct_latlng_pair[x].release_latlng == distinct_latlng_pair[y].forward_latlng && distinct_latlng_pair[x].forward_latlng == distinct_latlng_pair[y].release_latlng){
				  if(x > y){
					  distinct_latlng_pair.splice(x,1);
					  x = x - 1;
				  }else{
					  distinct_latlng_pair.splice(y,1);
					  y = y - 1;
				  }
			  }
		  }
	  }
	  
	  var max_repost_num = 0;
	  for(var w = 0;w < distinct_time.length;w = w + 1){
		  for(var x = 0;x < distinct_latlng_pair.length;x = x + 1){
			  var yespost = 0;
			  var nopost = 0;
			  var have1 = false;
			  var have2 = false;
			  for(var y = 0;y < temp_data.length;y = y + 1){
				  if(w == 0){
					if(temp_data[y].repost_time <= distinct_time[w]){
						if(distinct_latlng_pair[x].release_latlng == temp_data[y].release_province_latlng && distinct_latlng_pair[x].forward_latlng == temp_data[y].forward_province_latlng){
							have1 = true;
							yespost = temp_data[y].repost_num + yespost;
						}
						if(distinct_latlng_pair[x].release_latlng == temp_data[y].forward_province_latlng && distinct_latlng_pair[x].forward_latlng == temp_data[y].release_province_latlng){
							have2 = true;
							nopost = temp_data[y].repost_num + nopost;
						}
					}
				  }
				  if(w > 0){
					if(temp_data[y].repost_time <= distinct_time[w] && temp_data[y].repost_time > distinct_time[w-1]){
						if(distinct_latlng_pair[x].release_latlng == temp_data[y].release_province_latlng && distinct_latlng_pair[x].forward_latlng == temp_data[y].forward_province_latlng){
							have1 = true;
							yespost = temp_data[y].repost_num + yespost;
						}
						if(distinct_latlng_pair[x].release_latlng == temp_data[y].forward_province_latlng && distinct_latlng_pair[x].forward_latlng == temp_data[y].release_province_latlng){
							have2 = true;
							nopost = temp_data[y].repost_num + nopost;
						}
					}
				  }
			  }
			 
			  if(have1 == true || have2 == true){
				  if(yespost > nopost){
					  drawline_data.push({repost_time: distinct_time[w],
										   release_province_latlng: distinct_latlng_pair[x].release_latlng,
										   forward_province_latlng: distinct_latlng_pair[x].forward_latlng,
										   repost_num: yespost + nopost, 
										  
										});
					   if(max_repost_num < (yespost + nopost)){
							   max_repost_num = yespost + nopost;
					   }
				  }
				  if(yespost <= nopost){
					  drawline_data.push({repost_time: distinct_time[w],
										   release_province_latlng: distinct_latlng_pair[x].forward_latlng,
										   forward_province_latlng: distinct_latlng_pair[x].release_latlng,
										   repost_num: yespost + nopost,   
										});
					  if(max_repost_num < (yespost + nopost)){
							   max_repost_num = yespost + nopost;
					   }
				  }
			  }
		  }
	  }			 
	  
	  //根据repost_num的大小rank数组max_max_repost_num
	  var step_0 = Math.floor(max_repost_num/3);
	  var step_each = Math.floor(max_repost_num/3);
	  if(max_repost_num == 0){
		  for(var x = 0;x < drawline_data.length;x = x + 1){
			  drawline_data[x].rank =1;
		  }
	  }
	  if(max_repost_num <= 3 && max_repost_num > 0){
		  for(var x = 0;x < drawline_data.length;x = x + 1){
			  if(drawline_data[x].repost_num != 0){
				  drawline_data[x].rank = drawline_data[x].repost_num;
			  }else{
				  drawline_data[x].rank = 1;
			  }
		  }
	  }
	  if(max_repost_num > 3){
			for(var x = 0;x < drawline_data.length;x = x + 1){
				if(drawline_data[x].repost_num == 0){
						drawline_data[x].rank = 1;
				}
				else if(drawline_data[x].repost_num <= step_0){
						drawline_data[x].rank = 1;
				}
				else if(drawline_data[x].repost_num <= (step_0 + step_each)){
						drawline_data[x].rank = 2;
				}
				else if(drawline_data[x].repost_num <= max_repost_num){
						drawline_data[x].rank = 3;
				}				  
			}
	  }
	  
	  line_blue.innerText='0--' + step_0.toString();
	  line_yellow.innerText=step_0.toString() + '--'+(step_0 + step_each).toString();
	  line_red.innerText=(step_0 + step_each).toString()+ '--'+max_repost_num.toString();
	  
	  //检查drawcircle_data数据是否已完全处理
	  for(var x =0;x < drawcircle_data.length;x = x + 1){
		   
			if(drawcircle_data[x].release_time == undefined){
				console.log( x + 'drawcircle_data.release_time == undefined');
			}
			if(drawcircle_data[x].release_latlng == undefined){
				console.log( x + 'drawcircle_data.release_latlng == undefined');
			}
			if(drawcircle_data[x].status == undefined){
				console.log( x + 'drawcircle_data.status == undefined');
			}
			  
	   }
	
		 //检查drawline_data数据是否已完全处理
		for(var x =0;x < drawline_data.length;x = x + 1){
			  if(drawline_data[x].repost_time == undefined){
				  console.log( x + 'drawline_data.repost_time == undefined');
			  }
			  if(drawline_data[x].release_province_latlng == undefined){
				  console.log( x + 'drawline_data.release_province_latlng == undefined');
			  }
			  if(drawline_data[x].forward_province_latlng == undefined){
				  console.log( x + 'drawline_data.forward_province_latlng == undefined');
			  }
		}
}

function initialize() {
	
	present_topic.innerText = getUrlParam('topic');
    for (var x in mapWeibo.markerIcons) {		
    for (var y in mapWeibo.markerIcons[x]) {
            mapWeibo.markerIcons[x][y][0] = new google.maps.MarkerImage(mapWeibo.markerIcons[x][y][0],
                                            new google.maps.Size(40, 40),
                                            new google.maps.Point(0, 0), // origin
                                            new google.maps.Point(20, 20) // anchor
                                            );
		}
    }
    markerClusterer = new MarkerClusterer(map, [], {
					imagePath : '/static/images/map/clusters/',
					gridSize : 30,
					maxZoom : 9
	});

    $(document).ajaxStop($.unblockUI);	 
    $.blockUI({
		message: '<h2><img src="/static/images/ajax_loader.gif" /> Just a moment...</h2>'
    });
	$.ajax({
		  url : '/weiming/mapweibo/mapview?topic=' + mapWeibo.getPresentTopic + '&starttime=' + getUrlParam('starttime') + '&endtime=' + getUrlParam('endtime') ,
		  dataType : 'json',   
		  type: "POST",   
		  success : function (data) {
				dataHandle(data);
				//console.log(data.length);
				$("#select_topic").append("<option value='/mapweibo.html?topic=" + mapWeibo.getPresentTopic +"'>" + mapWeibo.getPresentTopic + "</option>");
				/*
				$.get("/gettopics/", function(result){
					//console.log(result);
   					for (var i=0;i<result.length;i=i+2) {
						//console.log(result[i]);

						$("#select_topic").append("<option value='/mapweibo.html?topic=" + result[i] +"'>" + result[i] + "</option>");	
					  }
					$("#select_topic").jQselectable({
						style: "simple",
						set: "fadeIn",
						out: "fadeOut",
						height: 150,
						opacity: .9,
						callback: function(){
							if($(this).val().length>0){ 
								  window.location = $(this).val();						 
							}
						}
				});
  				},'json');*/
				MyOverlay.prototype = new google.maps.OverlayView();
				MyOverlay.prototype.onAdd = function() { }
				MyOverlay.prototype.onRemove = function() { }
				MyOverlay.prototype.draw = function() {projection = overlay.getProjection(); }
				function MyOverlay(map) { this.setMap(map); }
				overlay = new MyOverlay(map);
				$.unblockUI();
			  },
	  });
	 
					
     $( '#slider' ).bind( 'slidechange', function(event, ui) {
             mapWeibo.now_step= parseInt($('#slider').slider( "option", "value" ));
			 if(mapWeibo.now_step == 0){
                if(markerClusterer != undefined){
				    markerClusterer.clearMarkers();
                }
				 date_div.innerText='';
				 if(lineClusterer != undefined){
			         lineClusterer.clearlines();
		         }
			 }
			 if(mapWeibo.now_step >= 1 && mapWeibo.now_step < mapWeibo.step_sum){
				   mapWeibo.now_step = mapWeibo.now_step - 1;
				   change_date_display();
			       change_map_display();
			 }
			 if(mapWeibo.now_step == mapWeibo.step_sum){
				   if(lineClusterer != undefined){
			         lineClusterer.clearlines();
				   }
                   if(markerClusterer != undefined){
				     markerClusterer.clearMarkers();
                   }
				   date_div.innerText='';
				   $('#slider').slider( "option", "value",0);	
			 }
			 
        });   
	
	
	function change_map_display(){		 
		 
		mapWeibo.clearMarkersByCategory();
        if(markerClusterer != undefined){
		   markerClusterer.clearMarkers();
         }
		if(lineClusterer != undefined){
			lineClusterer.clearlines();
		}
	
		 var time_period_circle_data=[];
		 for(var index=0;index<drawcircle_data.length;index+=1){
			 if(drawcircle_data[index].release_time == distinct_time[mapWeibo.now_step]){
				 time_period_circle_data.push({id: drawcircle_data[index].id,
								         latlng: drawcircle_data[index].release_latlng,
										 category: drawcircle_data[index].status,
										 fipost: drawcircle_data[index].fipost,
										 repost: drawcircle_data[index].repost
									   });					     
			 }
		 }
		 
		 var time_period_line_data = [];
		 
		 for(var x = 0;x < drawline_data.length; x = x + 1){
			 if(drawline_data[x].repost_time == distinct_time[mapWeibo.now_step]){
				 time_period_line_data.push({release_province_latlng: drawline_data[x].release_province_latlng,
											 forward_province_latlng: drawline_data[x].forward_province_latlng,	
											 repost_num: drawline_data[x].repost_num,
											 rank: drawline_data[x].rank
											});
			 }
		 }
		 
		  var marker;		
		  var markers = [];
		  
		  for ( var mark = 0; mark < time_period_circle_data.length; mark += 1 ) {
			  var item = time_period_circle_data[mark];
			  var id = item.id;
			  var split_latlng = item.latlng.split(' ');
			  var latLng = new google.maps.LatLng(split_latlng[0],split_latlng[1]);
			  var category = item.category;
			  var fipost = item.fipost;
			  var repost = item.repost;
			  
			  marker = new google.maps.Marker({
				  icon : mapWeibo.markerIcons[category][3][0],
				  position : latLng,
				  map : map
			  });
			  marker.id = id;
			  marker.category = category;
			  marker.fipost = fipost;
			  marker.repost = repost;
			  
			  
			  markers.push(marker);
			  		  
			  mapWeibo.markersByCategory[category].push(marker);
			  
			  google.maps.event.addListener(marker, 'mouseover', function(){
		          var marker = this;
				  infoWindow.preload(marker);
			  });
			  google.maps.event.addListener(marker, 'mouseout', infoWindow.close);
			  google.maps.event.addListener(map, 'click', infoWindow.close);
			  google.maps.event.addListener(map, 'drag', infoWindow.close);
			  google.maps.event.addListener(map, 'zoom_changed', function () {
				  infoWindow.close();
			  });
			  google.maps.event.trigger(map, 'resize')
		  }
		 
		  markerClusterer.addMarkers(markers,false);
		   
		  lineClusterer = new LineClusterer(map,time_period_line_data);
		  linesarray = lineClusterer.getlines();
		  
		  
	}
	$('#play_pause1').click(function() {
		  if (stoped==true) {	  
			  stoped=false;
	  		  mapWeibo.inter_slider=setInterval(play_interval,mapWeibo.interval_time);
		  }
	    });
  
	$('#play_pause2').click(function() {
		  stoped=true;
	});
	$('#play_pause3').click(function() {
		  stoped=true;
		  date_div.innerText='';
		  $('#slider').slider( "option", "value",0);	
	});
	
	function change_date_display(){
		var d = new Date(distinct_time[mapWeibo.now_step]*1000);
		date_div.innerText=d.getFullYear()+"/"+(d.getMonth()+1)+"/"+d.getDate()+" - "+ (d.getHours()+1) +":" + (d.getMinutes()+1) + ":" +(d.getSeconds()+1);
}

	
	function play_interval(){
		  if (stoped) {
			  if (mapWeibo.inter_slider!=null) {
			      clearInterval(mapWeibo.inter_slider);
			  }
		  } 
		  else {
			  if (mapWeibo.now_step <= mapWeibo.step_sum-2) {	
				  $("#slider" ).slider( "option", "value",(mapWeibo.now_step+2));
			  }
			  if(mapWeibo.now_step == mapWeibo.step_sum - 1){	
				  $("#slider" ).slider( "option", "value",(mapWeibo.now_step+1));
			  }
		  }
	}

}

$(function(){
    DOM.init();
	infoWindow.init();
	initialize();
	
});
