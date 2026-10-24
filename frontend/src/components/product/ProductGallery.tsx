import SmartImage from "../SmartImage";
import styles from "./ProductGallery.module.css"

type Props = {
    images: string[];
    selectedImage: string | null;
    selectedIndex: number;

    onSelect: (index: number) => void;

    onPrevious: () => void;
    onNext: () => void;
};

export default function ProductGallery({

    images,

    selectedImage,

    selectedIndex,

    onSelect,

    onPrevious,

    onNext,

}: Props) {

    return (

        <div className={styles.gallery}>

            {images.length > 1 && (

                <div className={styles.thumbnails}>

                    {images.map((img, i) => (

                        <div
                            key={i}
                         onClick={() => onSelect(i)}
                           className={`${styles.thumbnail} ${
        selectedIndex === i ? styles.active : ""
    }`}>

                            <SmartImage
                                src={img}
                                aspectRatio="1 / 1"
                            />

                        </div>

                    ))}

                </div>

            )}

            <div className={styles.viewer}>

                <SmartImage
                    src={selectedImage}
                    aspectRatio="4 / 5"
                    fit="contain"
                    enableFullscreen
                />

                {images.length > 1 && (

                    <>

                        <button
    className={`${styles.navButton} ${styles.prev}`}
    onClick={onPrevious}
>
    ‹
</button>

<button
    className={`${styles.navButton} ${styles.next}`}
    onClick={onNext}
>
    ›
</button>

                    </>

                )}

            </div>

        </div>

    );

}