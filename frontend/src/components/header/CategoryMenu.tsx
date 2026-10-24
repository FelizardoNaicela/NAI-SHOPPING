import { useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";

type Category = {
    id: string;
    name: string;
    children?: Category[];
};

type CategoryMenuProps = {
    categories: Category[];
    showCategories: boolean;
    setShowCategories: React.Dispatch<React.SetStateAction<boolean>>;
    className?: string;
    buttonClassName?: string;
    dropdownClassName?: string;
    categoryItemClassName?: string;
    subCategoryClassName?: string;
};

export default function CategoryMenu({
    categories,
    showCategories,
    setShowCategories,
    className,
    buttonClassName,
    dropdownClassName,
    categoryItemClassName,
    subCategoryClassName,
}: CategoryMenuProps) {

    const navigate = useNavigate();
    const catRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (
                catRef.current &&
                !catRef.current.contains(e.target as Node)
            ) {
                setShowCategories(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener(
                "mousedown",
                handleClickOutside
            );
    }, [setShowCategories]);
    return (
        <div
            ref={catRef}
            className={className}
        >
            <span
                onClick={() =>
                    setShowCategories(v => !v)
                }
                className={buttonClassName}
            >
                Categorias ▾
            </span>
            {showCategories && (
                <div className={dropdownClassName}>
                    {categories.map(cat => (
                        <div key={cat.id}>
                            <div
                                onClick={() =>
                                    navigate(`/category/${cat.id}`)
                                }
                                className={categoryItemClassName}
                            >
                                {cat.name}
                            </div>
                            {cat.children?.map(sub => (
                                <div
                                    key={sub.id}
                                    onClick={() =>
                                        navigate(`/category/${sub.id}`)
                                    }
                                    className={subCategoryClassName}
                                >
                                    {sub.name}
                                </div>
                            ))}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}