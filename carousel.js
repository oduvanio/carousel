/*
* copyright https://github.com/akiyatkin/carousel
*/
window.carousel = {
    zoom:0.4, //Максимальное уменьшение рамки
    zooming:5, //Скорость увеличения картинки
    speed:80, //Скорость вращения
    direct:true, //Направление вращения по умолчанию
    bg:"rgba(0,0,255,0.2)", //Цвет фона при наведении мышки
    bgfont:"rgba(0,0,0,0.8)", //Цвет текста
    wider:0.5,//Широкость иллюстраций
    print:function (param, image) {
        var tx=Math.cos((param.L+image.step)*Math.PI);
        var ty=Math.sin((param.L+image.step)*Math.PI);
        image.y=(1-ty)*param.ry;//Для сортировки, для подсветки и для клика
        image.x=(tx+1)*param.rx;
        if (image.over) {
            var delta=(1-image.prop);
            delta=delta*0.05;
            image.prop=image.prop+delta;//Увеличиваем
        } else {
            var prop=Math.pow((1-ty)/2,carousel.zooming);//1 когда близко и 0 когда далеко
            prop = prop+(1-prop)*carousel.zoom; //ограничиваем максимально допустимым зумом
            var delta=(prop-image.prop);
            if(delta>0){
                delta=delta*0.05;
            }else{
                delta=delta*0.05;
            }
            image.prop=image.prop+delta; //то что сейчас
        }
        var x=image.x+(param.maxwidth-image.minW*image.prop)/2;

        if (image.over) {
            param.context.fillStyle = carousel.bg;
            param.context.fillRect(x,image.y,image.minW*image.prop,image.minH*image.prop);
        }
        param.context.drawImage(image.img, x, image.y, image.minW*image.prop, image.minH*image.prop);
        if (image.over) {
            param.context.strokeRect(x,image.y,image.minW*image.prop,image.minH*image.prop);
            if (image.title) {
                param.context.fillStyle = "rgba(255,255,255,0.5)";
                param.context.fillRect(x,image.y+image.minH*image.prop-40,image.minW*image.prop,40);
                param.context.fillStyle = carousel.bgfont;
                param.context.fillText(image.title, x+5, image.y+image.minH*image.prop-10);
            }
        }
    },
    onload:function (param) {
        param.counter++;
        if (param.counter < param.images.length) return;
        carousel.each(param, function (image){
            var propW = param.maxwidth / image.img.width;
            var propH = param.maxheight / image.img.height;
            if (propW > propH){
                var prop = propH;
            } else {
                var prop = propW;
            }
            if (prop > 1) prop = 1;
            image.minW = image.img.width * prop;
            image.minH = image.img.height * prop;
        });
        carousel.draw(param);
    },
    draw:function (param) {
        if (!param.canvas.parentNode) return;//Выход если canvas пропал из DOM
        var over = param.over;
        param.over = false;
        carousel.each(param, function (image) {
            image.over = false;
            image.order=image.y;
            if( param.mouse && param.mouse.x > image.x && param.mouse.x < image.x + param.maxwidth
                && param.mouse.y > image.y && param.mouse.y < image.y + param.maxheight
            ){
                if(!over || over == image) {
                    param.over = image;//Установится оследняя
                }
            }
        });
        if (param.over) {
            param.over.over = true;
            param.over.order = 10000;
        }
        if (!param.over && over) {
            param.canvas.style.cursor = "default";
        } else if(!over && param.over) {
            param.canvas.style.cursor = "pointer";
        }
        param.images.sort(function(im1, im2){
            if (im2.order < im1.order) return 1;
            if (im2.order > im1.order) return -1;
        });
        param.context.clearRect(0, 0, param.canvas.width, param.canvas.height);
        carousel.each(param, function (image) {
            carousel.print(param, image);
        });
        if (param.direct) {
            param.L=param.L-param.speed/50000;
            if (param.L <= 0) param.L=param.L+2;//Периуд обращения
        } else {
            param.L=param.L+param.speed/50000;
            if (param.L >= 2) param.L=param.L-2;//Периуд обращения
        }
        setTimeout(function(){
            carousel.draw(param);
        },30);
        //window.requestAnimationFrame(function () {
            //carousel.draw(param);
        //});
    },
    init:function (canvas, images, click) {
        var param={};//Объект для хранения параметров передаётся во все функции
        if( canvas.carousel ) return;
        canvas.carousel=param;
        param.canvas=canvas;
        param.click=click;
        param.context = canvas.getContext("2d");
        param.context.lineWidth = "1";
        param.context.strokeStyle = carousel.bg ;
        param.context.font = "normal 30px Arial";
        param.L=0;//Пройденый путь по окружности в Пи.
        param.mouse=false;//Координаты мышки на канвасе
        param.step=2/images.length;//Смещение между картинками в Пи
        param.direct=carousel.direct;
        param.speed=carousel.speed;
        //Размер рамки
        param.maxheight=canvas.height/1.2;//HR
        param.maxwidth=param.maxheight*carousel.wider;//WR

        //Радиус окружности с отступом для смещения рамки вправо и вниз
        param.rx=(canvas.width-param.maxwidth)/2;
        param.ry=(canvas.height-param.maxheight)/2;
        param.curv=param.rx/param.ry;//Кривизна элипса для окружности будет 1 так как радиусы окружности равны
        param.images=images;
        param.counter=0;//Количество подгруженных картинок
        for (var i = 0, l = param.images.length; i < l; i++) {
            var image=param.images[i];
            image.step=param.step*i;
            image.prop=0.5;
            var img = new Image();
            img.onload=function(){
                carousel.onload(param);
            };
            img.src = images[i].src;
            image.img=img;
        }
        canvas.addEventListener("click",function(e){
            if (!param.over) return;
            var l=param.L+param.over.step;
            l=l%2;
            delta=1.5-l;
            param.speed=0;
            //param.L=param.L+delta;
            param.context.clearRect(0, 0, param.canvas.width, param.canvas.height);
            param.click(param.over);
        });
        canvas.addEventListener("mouseout",function(e){
            param.mouse=false;
        });
        canvas.addEventListener("mousemove",function(e){
            var k=param.canvas.width/param.canvas.offsetWidth;//Растянутость канваса
            var x=e.offsetX*k;//Координаты клика
            var y=e.offsetY*k;
            var mouse=param.mouse;
            param.mouse={x:x, y:y};
            var delta=mouse.x-param.mouse.x;
            if(!delta)delta=0;
            var k=5;
            if(param.mouse.y<param.ry || param.over)delta=delta*-1;//Если выше тригонометрического радиуса то эффект обратный - сверху окружности или снизу
            if (param.speed>0) { //По часовой
                if(delta>0){
                    param.speed=param.speed+Math.sqrt(delta)*k;
                } else {
                    param.speed=param.speed+delta*k;
                }
            } else { //Против часовой
                if(delta<0){//Уменьшаем
                    param.speed=param.speed-Math.sqrt(delta*-1)*k;
                } else {
                    param.speed=param.speed+delta*k;
                }
            }
        });
        return param;
    },
    each:function (param,call) {
        for (var i = 0, l = param.images.length; i < l; i++) {
            var image=param.images[i];
            var r=call(image);
            if (typeof(r)!=='undefined') return r;
        }
    }
}
