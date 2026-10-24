import { Link } from "react-router-dom";
import CategoryMenu from "./CategoryMenu";

type Category = {
    id: string;
    name: string;
    children?: Category[];
};

type HeaderLeftProps = {
    categories: Category[];

    showCategories: boolean;
    setShowCategories: React.Dispatch<
        React.SetStateAction<boolean>
    >;

    onHomeClick: (e: React.MouseEvent) => void;

    leftClassName: string;
    logoClassName: string;

    categoriesClassName: string;
    categoryButtonClassName: string;
    dropdownClassName: string;
    categoryItemClassName: string;
    subCategoryClassName: string;
};

export default function HeaderLeft({
    categories,
    showCategories,
    setShowCategories,
    onHomeClick,
    leftClassName,
    logoClassName,
    categoriesClassName,
    categoryButtonClassName,
    dropdownClassName,
    categoryItemClassName,
    subCategoryClassName,
}: HeaderLeftProps) {
    return (
        <div className={leftClassName}>
            <Link
                to="/"
                onClick={onHomeClick}
                className={logoClassName}
            >
                NAI
            </Link>

            <CategoryMenu
                categories={categories}
                showCategories={showCategories}
                setShowCategories={setShowCategories}
                className={categoriesClassName}
                buttonClassName={categoryButtonClassName}
                dropdownClassName={dropdownClassName}
                categoryItemClassName={categoryItemClassName}
                subCategoryClassName={subCategoryClassName}
            />
        </div>
    );
}