if((/https:\/\//).test(location.href)) {
    link = 'topbar.css'
} else {
    link = 'topbar.css'
}
function mouse_over_style1(ele1, ele2) {
    ele1.hover(function() {
        ele2.css({
            display: "block"
        });
        setTimeout(function() {
            ele2.addClass("show");
        }, 10);
    }, function() {
        ele2.removeClass("show");
        setTimeout(function() {
            ele2.css({
                display: "none"
            });
        }, 200);
    });
}
var Top = {
    isShow: 1,
    isShowBan: {
        "ttrw.yingxiong.com": 1,
        "ca.yingxiong.com": 1,
        "ttx5.yingxiong.com": 1,
        "xm.yingxiong.com": 1,
        "gf.yingxiong.com": 1,
        "mx.yingxiong.com": 1,
        "quan.yingxiong.com": 1,
        "ddd2.yingxiong.com": 1,
        "dfzj.yingxiong.com": 0,
        "qtdl.yingxiong.com": 1,
        "tstd.yingxiong.com": 0,
        "we.yingxiong.com": 0,
        "xsg.yingxiong.com": 0,
        "y.yingxiong.com": 0,
        "zjlm.yingxiong.com": 0,
        "sm.yingxiong.com": 1,
        "sm.me.yingxiong.com": 1,
        "sm.demo.yingxiong.com": 1,
        "sjsgz.yingxiong.com": 1,
        "sjsgz.me.yingxiong.com": 1,
        "sjsgz.demo.yingxiong.com": 1,
        'cd.yingxiong.com': 1,
        'cd.demo.yingxiong.com': 1,
        'lszt.yingxiong.com': 1,
        'lszt.demo.yingxiong.com': 1,
    },
    
    website: {
        "clqx.*.yingxiong.com": 59,
        "fc.*.yingxiong.com": 24,
        "brdz.*.yingxiong.com": 65,
        "jj.*.yingxiong.com": 25,
        "sm.*.yingxiong.com": 26,
        "ddd2.*.yingxiong.com": 27,
        "cc.*.yingxiong.com": 28,
        "sourcecc.*.yingxiong.com": 28,
        "tstd.*.yingxiong.com": 29,
        "sjsgz.*.yingxiong.com": 29,
        "fk.*.yingxiong.com": 30,
        "yqlmx.*.yingxiong.com": 31,
        "xsqs.*.yingxiong.com": 33,
        "cd.*.yingxiong.com": 34,
        "ca.*.yingxiong.com": 35,
        "jws.*.yingxiong.com": 37,
        "wctt.*.yingxiong.com": 38,
        "y.*.yingxiong.com": 39,
        "dfzj.*.yingxiong.com": 40,
        "df.*.yingxiong.com": 95,
        "qtdl.*.yingxiong.com": 41,
        "xm.*.yingxiong.com": 42,
        "zjlm.*.yingxiong.com": 43,
        "tank.*.yingxiong.com": 43,
        "mx.*.yingxiong.com": 44,
        "gf.*.yingxiong.com": 45,
        "acewar.*.yingxiong.com": 48,
        "wpys.*.yingxiong.com": 49,
        "lzl.*.yingxiong.com": 57,
        "hero.*.yingxiong.com": 62,
        "xsjs.*.yingxiong.com": 63,
        "zzyzf.*.yingxiong.com": 66,
        "csmsl.*.yingxiong.com": 67,
        "dream.*.yingxiong.com": 68,
        "sd.*.yingxiong.com": 73,
        "wjyx.*.yingxiong.com": 75,
        "qyzz.*.yingxiong.com": 74,
        "fwy.zhengyuetech.com": 78,
        "fwy.*.yingxiong.com": 78,
        "tk.*.yingxiong.com": 80,
        "nba.*.yingxiong.com": 85,
        "mw.*.yingxiong.com": 83,
        "bz.*.yingxiong.com": 82,
        "zg.*.yingxiong.com": 81,
        "rw.*.yingxiong.com": 52,
        "sszj.*.yingxiong.com": 84,
        "ddd3.*.yingxiong.com": 86,
        "hqwm.*.yingxiong.com": 88,
        "sg.*.yingxiong.com": 87,
        "super.*.yingxiong.com": 92,
        "zhs.*.yingxiong.com": 94,
        "szhl.*.yingxiong.com": 93,
        "zq.*.yingxiong.com": 95,
        "heroim.com": 46,
        "lszt.*.yingxiong.com": 98,
        "yx.*.yingxiong.com":32,
        "www.*.yingxiong.com":32,
        "kok.*.yingxiong.com": 100,
        "xq.*.yingxiong.com": 99,
        "pp.*.yingxiong.com": 105,
        "flower.*.yingxiong.com": 106,
        "xxjt.*.yingxiong.com": 108,
        "fc2.*.yingxiong.com" : 114,
        "nscy.*.yingxiong.com" : 116,
    },
    content: '<div id="Hero-bar"><div class="hero_head"><div><a class="hero_logo" onclick="loi()"></a><div class="hero_middle"><span class="hero_title">一切以玩家乐趣为依归</span></div><a id="top_banner_a"><img id="top_middle_img" style="display:none" class="middle_pic" src="" alt=""></a><a target="_blank" class="middle_big_img" style="display:none"><img src="" alt=""></a></div><div class="hero_options"><div class="hero_right"><a class="hero_user" onclick="loi()"4  target="_blank"><i></i>账号中心</a><a class="hero_help" onclick="loi()" target="_blank"><i></i>客服中心</a></div><div class="game_list_bar"><span>游戏列表<i></i></span><div class="game_list_box" style="display:none"><div class="box_bar"><span class="hotest"><i></i>热门推荐</span><span class="lastest"><i></i>最新推荐</span></div><ul><li class="active1"><a onclick="loi()" target="_blank">全民枪战2<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li><li class="active1 active2"><a onclick="loi()" target="_blank">绿色征途<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li><li class="active2"><a onclick="loi()" target="_blank">王牌战争:文明重启<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li><li class="active1 active2"><a onclick="loi()" target="_blank">巅峰坦克：装甲战歌<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li><li class="active1"><a onclick="loi()" target="_blank">巅峰战舰<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li><li class="active1"><a onclick="loi()" target="_blank">创造与魔法<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li><li class="active1"><a onclick="loi()" target="_blank">极无双<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li><li class=""><a onclick="loi()" target="_blank">弹弹岛2<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li><li class=""><a onclick="loi()" target="_blank">抢滩登陆3D<i class="hot_icon_yl"></i><i class="new_icon_yl"></i></a></li></ul></div></div></div></div></div>',
    link: link
};
if(Top.isShow
//&& Top.isShowBan[window.location.host]
) {
    ! function() {
        var t = function(t) {
            return document.getElementById(t)
        }
        !new function() {
            var node = document.createElement("link");
            node.setAttribute("rel", "stylesheet");
            node.setAttribute("href", Top.link);
            document.body.appendChild(node);
        }
        !new function() {
            var node = document.createElement("div");
            node.id = "Hero-bar";
            node.innerHTML = Top.content;
            document.body.appendChild(node);
        }
    }();
}
setTimeout(function() {

    $(function() {
        var site_name="";
        var site_id="";
        var site_url="";
        var channel="";
        var flag="";
        var host = window.location.host;
        if (typeof websiteId !== "undefined") {
        		website = websiteId;
        } else if(host.indexOf('yingxiong.com')) {
            var arr = host.split('.');
            var all_host = arr[0] + '.*.yingxiong.com';
            var website = Top.website[all_host];
        }  else {
            var website = Top.website[window.location.host];
        } 
        // $.get('/commonMethod/ajax-count.html',{},function(data){
        //     if(data.status==0){
        //         $('head').append(data.data);
        //     }
        // },'json');
        if(website==39 || website==44 || website==43 || website==38 ||website==45 || website==42|| website==41 || website == 48){
            var url='//cms.yingxiong.com/common-method/ajax-website';
        }else{
            var url='/commonMethod/ajax-website.html';
        }

        $.get(url, {
            id: website
        }, function(data) {
            if(data.status == 0) {
                site_name = data.msg.site_name!=undefined?data.msg.site_name:'';
                site_id = data.msg.id!=undefined?data.msg.id:0;
                site_url = data.msg.site_url!=undefined?data.msg.site_url:'';
                channel = data.channel!=undefined?data.channel:'';
                flag = data.flag!=undefined?data.flag:0;
                $('head').append('<script>var websiteInfo={};websiteInfo.channel="'+channel+'";websiteInfo.flag="'+flag+'";websiteInfo.site_name="'+site_name+'";websiteInfo.site_id="'+site_id+'";websiteInfo.site_url="'+site_url+'";</script>');

                if(data.flag==1 && typeof url_id !== "undefined"){
                    $('.channel_name').css('display','block');
                    $('.channel_tap_name').css('display','none');
                    $('.no_channel').css('display','none');
                    
                }else if(data.flag==2 && typeof url_id !== "undefined"){
                    $('.channel_tap_name').css('display','block');
                    $('.channel_name').css('display','none');
                    $('.no_channel').css('display','none');
                    $('.channel_name').css('display','block');
                    $('.channel_tap_name').css('display','none');
                    $('.no_channel').css('display','none');
                }
                if(data.msg.logo_img != '' && data.msg.logo_img != undefined ) $('#logo_img').attr('src',data.msg.logo_img);
                if(data.msg.icon_img != '' && data.msg.icon_img != undefined ) $('head').append('<link href="'+data.msg.icon_img+'" rel="SHORTCUT ICON">');
                if(data.msg.site_name != '' && data.msg.site_name != undefined )    $('#site_name').text(data.msg.site_name);
                if(data.msg.title != '' && data.msg.title != undefined )    $('#title').text(data.msg.title);
                if(data.msg.sub_title != '' && data.msg.sub_title != undefined )    $('#sub_title').text(data.msg.sub_title);
                if(data.msg.wx_img != '' && data.msg.wx_img != undefined )   $('#wx_img').attr('src',data.msg.wx_img);
                if(data.msg.wb_img != '' && data.msg.wb_img != undefined )   $('#wb_img').attr('src',data.msg.wb_img);
                if(data.msg.tb_img != '' && data.msg.tb_img != undefined )   $('#tb_img').attr('src',data.msg.tb_img);
                if(data.msg.wb_url != '' && data.msg.wb_url != undefined )   $('#wb_url').text(data.msg.wb_url);
                if(data.msg.tb_url != '' && data.msg.tb_url != undefined )   $('#tb_url').text(data.msg.tb_url);

                // $('head').append(data.msg.web_count);
                $('meta[name="csrf-token"]').attr('content',data.csrf);

                if(data.msg.top_banner_status == 1 && data.msg.top_banner_img) {
                    $('#top_middle_img').show();
                    $('#top_middle_img').attr('src', data.msg.top_banner_img);
                    $('.middle_big_img').attr('href', data.msg.top_banner_url);
                    $('.middle_big_img img').attr('src', data.msg.top_banner_big_img);
                    $("#top_banner_a").mouseover(function() {
                        $(this).hide();
                        $(".middle_big_img").show();
                    });
                    $(".middle_big_img").mouseout(function() {
                        $(this).hide();
                        $("#top_banner_a").show();
                    })

                    // $.get('//cc.yingxiong.com/commonMethod/ajax-banner-pv.html', {
                    //     id: website
                    // }, function() {});
                } else {
                    $('#top_middle_img').hide();
                }
                if(data.websiteList.length>0){
                    var result = '';
                    var class_name="";
                    for(var i = 0; i < data.websiteList.length; i++) {
                       if(data.websiteList[i].is_hot == 1  &&  data.websiteList[i].is_new == 1){
                            class_name="active1 active2";
                       }else if(data.websiteList[i].is_hot == 1  &&  data.websiteList[i].is_new == 0){
                            class_name="active1";
                       }
                       else if(data.websiteList[i].is_hot == 0  &&  data.websiteList[i].is_new == 1){
                            class_name="active2";
                       }else{
                            class_name="";
                       }
                       result += "<li class='"+class_name+"'><a href='" + data.websiteList[i].jump_url+"' target='_blank'>"+data.websiteList[i].site_name+"<i class='hot_icon_yl'></i><i class='new_icon_yl'></i></a></li>";
                    }
                    $('.game_list_box ul').append(result);
                }else{
                    $(".game_list_bar").hide();
                }
            } else {
                $('#top_middle_img').hide();
            }
        }, 'json');

        $('.middle_big_img').click(function() {
            $.get('//cms.yingxiong.com/common-method/ajax-banner-click', {
                id: website
            }, function() {});
        });
        mouse_over_style1($(".game_list_bar"), $(".game_list_box"));

    })

}, 500)