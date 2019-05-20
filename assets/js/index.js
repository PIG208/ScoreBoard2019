 

        class ScoreBar
        {
            constructor(name, score, targetBefore)
            {
                console.log("created " + name);
                this.name = name;
                this.score = score;
                //创建ScoreBar对象对应的<li>元素
                this.target = $("<li></li>").css({"display":"none"});
                //将新建的<li>加入scoreBars中
                if(targetBefore == undefined) targetBefore = $("#scoreBars > li").last();
                targetBefore.after(this.target);
            }

/**
 * 显示柱形
 * */
            showBar(callback)
            {
                this.target.fadeIn();
                //显示后需要运行垂直自适应fitBars
                fitBars($("#scoreBars"), () => { });
                //分数自动增长
                this.growTo(800 * (this.score / 100), true, 3200 * (this.score / 100), callback);
            }

            destroy(callback)
            {
                this.growTo(2000, false, 350, () => {
                    this.target.animate({ "margin-left": 2000 }, 1000, "swing", () => {
                        this.target.fadeOut(200, () => {
                            fitBars($("#scoreBars"), callback);
                        });
                    });
                });
            }

/*
 * 使得柱形增长到指定宽度
 * @param width 柱形最终宽度
 */
            growTo(width, name, duration, callback)
            {
                this.target.animate({ "width": width }, duration, "swing", () => {
                    if (name) {
                        var nameBar = $("<span>" + this.name + "</span>");
                        this.target.append(nameBar.fadeIn(200, callback));
                    }
                    else
                        callback();
                });
            };

            toString()
            {
                return this.name + ", " + this.score + " [" + this.target.index() + "]";
            }
        }
        
//初始化
var bars = new Array();
var scores = new Map();
var pointer = 0;
var singers = new Array();
var barDisplay = new Array();
const roundConst = [0, 6, 4];

var isInserting = false;

$(document).ready(() => {
    //获取选手数据
    refresh(1);
    //分数条垂直居中
    fitBars($("#scoreBars"), () => {
        //回调隐藏遮罩
        $("#blank").fadeOut();
    });
});

//li 柱形交换位置(indexA,indexB从1开始)
function swap(indexA, indexB, callback)
{
    //indexB必须大于indexA
    if (indexA > indexB)
    {
        var temp = indexA;
        indexA = indexB;
        indexB = temp;
    }
    if (indexA == indexB || indexA >= $("#scoreBars > li").length || indexB >= $("#scoreBars > li").length)
    {
        callback(indexA);
        return "failed";
    }
    //计算调换位置需要的距离
    var distance = (parseFloat($("#scoreBars > li").css("height")) + parseFloat($("#scoreBars > li").css("margin-top")) + parseFloat($("#scoreBars > li").css("border-width")) * 2) * (indexA - indexB);
    //通过更改top移动柱形
    console.log(indexA - 1, bars[indexA - 1]);
    bars[indexA - 1].target.stop(true,true).animate({ "top": -distance + "px" }, { easing: "swing", queue: false });
    bars[indexB - 1].target.stop(true,true).animate({ "top": distance + "px" }, "swing", () => {
        //柱形移动到目标地点时更改<li>元素在<ol>中的位置，同时将top重置为0px
        $("#scoreBars > li").eq(indexB).after(bars[indexA - 1].target.css({ "top": "0px" }));
        $("#scoreBars > li").eq(indexA).before(bars[indexB - 1].target.css({ "top": "0px" }));
        //将bars数组中的ScoreBar实例调换位置
        var temp = bars[indexA - 1];
        bars[indexA - 1] = bars[indexB - 1];
        bars[indexB - 1] = temp;
        //调用回调
        callback(indexA - 1);
    });
    return 1;
}
//表单验证
var scoreCheck = function(){
    var score = parseFloat($("#score").val());
    if(!isNaN(score))
        $("#score").val(score);
    if (isNaN(score) || score > 100 || score < 0)
    {
        $("#score").css({ "border-color": "#ff0000" });
        return false;
    }
    else
    {
        $("#score").css({ "border-color": "#d9d9d9" });
        return true;
    }
};   
var nameCheck = function(){
    $("#name").val($("#name").val().trim());
    var name = $("#name").val();
    if (name.trim() == "")
    {
        $("#name").css({ "border-color": "#ff0000" });
        return false;
    }
    else
    {
        $("#name").css({ "border-color": "#d9d9d9" });
        return true;
    }
};
var roundCheck = function(){
    if($(".radio").eq(0).is(":checked") || $(".radio").eq(1).is(":checked"))
    {
        $(".radioGroup").css({"color":"initial"});
        return true;
    }
    else
    {
        $(".radioGroup").css({"color":"#ff0000"});
        return false;
    }
}

$("#name").change(nameCheck);

$("#score").change(scoreCheck);

$(".radio").change(roundCheck);

//ajax 存储表单
var isSubmitting = false;
var submit = () => {
    //防止重复提交
    if(isSubmitting) 
    {
        alert("请等待操作完成");
        return;
    }

    //表单检验
    if(!nameCheck() || !scoreCheck() || !roundCheck()) return;

    //ajax提交
    var info = $("#form").serializeArray();
    isSubmitting = true;
    $.ajax({
        url: 'handlers/formHandler.ashx',
        data: info,
        dataType: 'text',
        method: 'POST',
        content: 'document/body',
        aysnc: false,
        success: function (data) {
            if(data = "1")
            {
                $("#name").val("");
                $("#score").val("");
                $(".radio").prop("checked", false);
            }
            isSubmitting = false;
        },
        error: function (data) {
            alert("发生了错误: " + data.statusCode.toString());
            isSubmitting = false;
        }
    });
};
$("#form > .text").keyup(e => {
    if(e.keyCode == 13)
        submit();
});
$(".submit").click(submit);

//存储数据
var captureData = (data) => {
    data.forEach(element => {
        var index = -1;
        singers.forEach(singer => {
            if(singer["id"] == element["id"]) {
                index = singers.indexOf(singer);
            }
        });
        if (index >= 0)
        {
            singers[index] = element;
        }
        else
        {
            singers.push(element);
        }
    });
}

//ajax查询
function query(specifier, callback){
    $.ajax ({
        url: 'handlers/queryHandler.ashx',
        method: 'GET',
        data: specifier,
        async: true,
        dataType: 'json',
        success: (data) => {
            captureData(data);
            if(callback != undefined && callback != null)
                callback()
        }
    })
};

//刷新
function refresh(round, callback) {
            
    if (singers != null && singers.length > 0)
    {
        query(`and rd${round}_time_stamp>\'${singers[singers.length - 1][`rd${round}_time_stamp`]}\' ORDER BY rd${round}_time_stamp`, callback);
    }
    else
    {
        query(`ORDER BY rd${round}_time_stamp`, callback);
    }
}


//ol ScoreBars滑动居中
function fitBars(target, callback)
{
    var top = (window.innerHeight - parseFloat(target.css("height"))) / 2;
    if (top != parseFloat(target.css("height")))
        target.animate({
            "top": top
        }, "normal", callback);
}

function getLastSinger(round)
{
    //在外部定义singer
    var singer;
    //遍历singers，找到singers中除存在于barDisplay中的对象之外的最后一位选手
    singers.forEach(curSinger => {
        if (curSinger[`rd${round}_time_stamp`]!="" && !barDisplay.includes(curSinger))
            singer = curSinger;
    });
    return singer;
}

function getBestSinger(round)
{
    //寻找singers中第一个不属于barDisplay的对象
    var singer = singers.find(test => !barDisplay.includes(test));
    //遍历singers，找到singers中除存在于barDisplay中的对象之外的，当前回合分数最高的选手
    if(singer != null && singer != undefined)
        singers.forEach(curSinger => {
            if (curSinger[`rd${round}_time_stamp`]!="" && !barDisplay.includes(curSinger) && parseFloat(curSinger[`rd${round}_score`]) > parseFloat(singer[`rd${round}_score`]))
                singer = curSinger;
        });
    return singer;
}

function getNextSinger(round) {
    var singer = null;
    if (pointer > singers.length || singers[pointer] == null) {
        if (singers[0] != 0) {
            pointer = 0;
            singer = singers[pointer];
        }
    }
    else {
        if (!singer[`rd${round}_time_stamp`] != "") {
            pointer++;
            singer = getNextSinger(round);
        }
        else {
            singer = singers[pointer++];
        }
    }
    return singer;
}

function insertSinger(singer, round)
{
    if (isInserting) return;
    isInserting = true;
    lastIndex = (barDisplay.length < roundConst[round]) ? barDisplay.length : (roundConst[round] - 1);
    bars[lastIndex] = new ScoreBar(singer["name"], parseFloat(singer[`rd${round}_score`]));
    //显示占位分数柱
    bars[lastIndex].showBar(() => {
        //将循环的起始点设定为barDisplay的长度，即最后一行分数柱之后
        var i = lastIndex;
        //使用递归回调将分数柱插入
        var cb = n => {
            if (barDisplay[n - 1] != null && parseFloat(barDisplay[n - 1][`rd${round}_score`]) < parseFloat(singer[`rd${round}_score`]))
                swap(n, n + 1, cb);
            else {
                var i = lastIndex;
                var pos = n;
                for (; i > pos; i--) {
                    barDisplay[i] = barDisplay[i - 1];
                }
                //将singer插入barDisplay的正确位置
                barDisplay[pos] = singer;
                var redestroy = (index) => {
                    if (bars[index] != null)
                        bars[index].destroy(index => {
                            bars[index] = null;
                            barDisplay[index] = null;
                            if (index > roundConst)
                                redestroy(index - 1);
                            else
                                isInserting = false;
                        });
                    else
                        redestroy(index - 1);
                };
                if (barDisplay.length >= roundConst[round])
                    bars[barDisplay.length - 1].destroy(() => {
                        bars[barDisplay.length - 1] = null;
                        barDisplay[barDisplay.length - 1] = null;
                        isInserting = false;
                    });
                else
                    isInserting = false;
            }
        };
        cb(i);
    });
}

var roundkey = 0;
//测试函数 Q键生成分数柱
$(window).keydown(e => {
    console.log(e.keyCode);
    switch (e.keyCode) {
        //Q模拟第一轮第十一个选手演唱后的出分流程
        case 81:
            if (roundkey == 0)
                roundkey = 1;
            $("title").val("回合一");
            //refresh(roundkey, () => {
            //    if (singers.length > barDisplay.length || singers.length == roundConst[roundkey]) {
            //        insertSinger((barDisplay.length < roundConst[roundkey]) ? getBestSinger(roundkey) : getLastSinger(roundkey), roundkey);
            //    }
            //});
            break;
            //W
        case 87:
            if(roundkey != 0)
                refresh(roundkey, () => {
                    if (singers.length > barDisplay.length || singers.length == roundConst[roundkey]) {
                        insertSinger(getBestSinger(roundkey), roundkey);
                    }
                });
            break;
            //E
        case 69:
            if(roundkey != 0)
                refresh(roundkey, () => {
                    if (singers.length > barDisplay.length || singers.length == roundConst[roundkey]) {
                        insertSinger(getLastSinger(roundkey), roundkey);
                    }
                });
            break;
        case 82:
            if(roundkey == 0)
                roundkey = 2;
            $("title").val("回合二");
            //refresh(roundkey, () => {
            //    if (singers.length > barDisplay.length || singers.length == roundConst[roundkey]) {
            //        insertSinger((barDisplay.length < roundConst[roundkey]) ? getBestSinger(roundkey) : getLastSinger(roundkey), roundkey);
            //    }
            //});
            break;
        case 83:
            if (roundkey != 0)
                refresh(roundkey, () => {
                    if (singers.length > barDisplay.length || singers.length == roundConst[roundkey]) {
                        insertSinger(getNextSinger(roundkey), roundkey);
                    }
                });
            break;
        case 32:
            $("#name").val(genName());
            $("#score").val(Math.random() * 100);
            $(".radio").eq(0).prop(":checked", true);
            break;
        case 27:
            if($(".formHolder").css("display") == "none")
                $(".formHolder").stop(true).fadeIn(100);
            else
                $(".formHolder").stop(true).fadeOut(100);
            break;
    }
});

//测试函数 名字生成器
const LAST_NAMES = "赵钱孙李周吴郑王冯陈楮卫蒋沈韩杨朱秦尤许何吕施张孔曹严华金魏陶姜戚谢邹喻柏水窦章云苏潘葛奚范彭郎鲁韦昌马苗凤花方俞任袁柳酆鲍史唐费廉岑薛雷贺倪汤滕殷罗毕郝邬安常乐于时傅皮卞齐康伍余元卜顾孟平黄和穆萧尹姚邵湛汪祁毛禹狄米贝明臧计伏成戴谈宋茅庞";
const FIRST_NAMES = "选择自信豁达坦然就是在名利面前岿不动势力昂首挺胸撑开的帆破流向展示搏击风采";
function genName()
{
    return LAST_NAMES.substr(Math.random() * LAST_NAMES.length, 1) + FIRST_NAMES.substr(Math.random() * FIRST_NAMES.length, 1) + FIRST_NAMES.substr(Math.random() * FIRST_NAMES.length, 1);
}

//测试函数 控制宽度增长及上限
function increase(width)
{
    width *= 2.5;
    if (width > window.innerWidth * 0.8) width = 100;
    return width;
}