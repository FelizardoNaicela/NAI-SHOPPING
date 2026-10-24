import {
    useEffect,
    useRef,
    useState,
} from "react";

type Props = {

    src: string;

    alt?: string;

    maxZoom?: number;

    className?: string;

    style?: React.CSSProperties;

};

export function ZoomableImage({

    src,

    alt,

    maxZoom = 5,

    className,

    style,

}: Props) {
    const lastTap = useRef(0);

    const imageRef =
        useRef<HTMLImageElement>(null);

    const pointers =
        useRef<Map<number, PointerEvent>>(
            new Map(),
        );

    const pinchDistance =
        useRef(0);

    const [zoom, setZoom] =
        useState(1);

    const [position, setPosition] =
        useState({

            x: 0,

            y: 0,

        });

    const dragging =
        useRef(false);

    const dragStart =
        useRef({

            x: 0,

            y: 0,

        });

        function onPointerTap() {

    const now = Date.now();

    if (now - lastTap.current < 250) {

        if (zoom === 1) {

            setZoom(2);

        } else {

            reset();

        }

    }

    lastTap.current = now;

}

    function reset() {

        setZoom(1);

        setPosition({

            x: 0,

            y: 0,

        });

    }

    function clamp(value:number){

        return Math.min(

            maxZoom,

            Math.max(1,value),

        );

    }

 function onWheel(e: React.WheelEvent) {
  e.preventDefault();

  const factor = e.ctrlKey ? 0.004 : 0.0015;
  const delta = -e.deltaY * factor;

  setZoom((old) => clamp(old + delta));
}

    function onDoubleClick(){

        if(zoom===1){

            setZoom(2);

        }else{

            reset();

        }

        if (zoom < 1.08) {

    reset();

}

    }

    function onPointerDown(

        e:React.PointerEvent,

    ){

        pointers.current.set(

            e.pointerId,

            e.nativeEvent,

        );

        if(

            pointers.current.size===1 &&

            zoom>1

        ){

            dragging.current=true;

            dragStart.current={

                x:e.clientX-position.x,

                y:e.clientY-position.y,

            };

        }

    }

    function onPointerMove(

        e:React.PointerEvent,

    ){

        if(

            !pointers.current.has(

                e.pointerId,

            )

        ) return;

        pointers.current.set(

            e.pointerId,

            e.nativeEvent,

        );

        const values=[
            ...pointers.current.values(),
        ];

        if(values.length===2){

            const a=values[0];

            const b=values[1];

            const distance=Math.hypot(

                a.clientX-b.clientX,

                a.clientY-b.clientY,

            );

            if(

                pinchDistance.current===0

            ){

                pinchDistance.current=

                    distance;

            }else{

                const factor=

                    distance/

                    pinchDistance.current;

                pinchDistance.current=

                    distance;

                setZoom(old=>

                    clamp(old*factor)

                );

            }

            return;

        }

        if(

            dragging.current &&

            zoom>1

        ){

            setPosition({

                x:

                    e.clientX-

                    dragStart.current.x,

                y:

                    e.clientY-

                    dragStart.current.y,

            });

        }

    }

    function onPointerUp(

        e:React.PointerEvent,

    ){

        pointers.current.delete(

            e.pointerId,

        );

        pinchDistance.current=0;

        dragging.current=false;

    }

    useEffect(()=>{

        reset();

    },[src]);

    return(
<div
    onClick={(e)=>e.stopPropagation()}
    style={{
        display:"flex",
        justifyContent:"center",
        alignItems:"center",
    }}
>
        <img

            ref={imageRef}

            src={src}

            alt={alt}

            draggable={false}

            className={className}

            style={{

                ...style,

                transform:

                    `translate(${position.x}px,${position.y}px) scale(${zoom})`,

                transition:

                    dragging.current

                        ?"none"

                        :"transform .18s",

                cursor:
    zoom>1
        ? (dragging.current ? "grabbing" : "grab")
        : "zoom-in",

                touchAction:"none",

                userSelect:"none",

            }}

            onWheel={onWheel}

            onDoubleClick={onDoubleClick}

            onPointerDown={onPointerDown}

            onPointerMove={onPointerMove}
            onPointerCancel={onPointerUp}

            onPointerLeave={onPointerUp}

            onPointerUp={(e) => {

    onPointerUp(e);

    onPointerTap();

}}

        />
</div>
    );

}