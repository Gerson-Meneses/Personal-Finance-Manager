import { useMemo, useState } from "react";
import dayjs from "dayjs";
import "dayjs/locale/es";
import { PackageSearch, Store, TrendingDown } from "lucide-react";
import { useProductDetail, useProducts } from "../../../features/products/hooks";
import type { ProductQuery, ProductSummary } from "../../../features/products/types";
import { SearchInput } from "../../../shared/components/SearchInput/SearchInput";
import { SelectInput } from "../../../shared/components/SelectInput/SelectInput";
import LoadingScreen from "../../../shared/components/LoadingScreen/LoadingScreen";
import ModalPortal from "../../../shared/components/ModalPortal/ModalPortal";
import { formatCurrency } from "../../../shared/utils/formatCurrency";
import "./ProductsPage.css";

dayjs.locale("es");

const ORDER_OPTIONS: { value: NonNullable<ProductQuery["order"]>; label: string }[] = [
    { value: "recent", label: "Más recientes" },
    { value: "price", label: "Mejor precio" },
    { value: "purchases", label: "Más comprados" },
    { value: "name", label: "Nombre A-Z" },
];

const formatDate = (date?: string | null) => (date ? dayjs(date).format("DD MMM YYYY") : "—");

interface DetailProps {
    product: ProductSummary;
    onClose: () => void;
}

function ProductDetailModal({ product, onClose }: DetailProps) {
    const { data, isLoading, isError } = useProductDetail(product.normalizedName);

    return (
        <ModalPortal isOpen onClose={onClose}>
            <div className="product-detail">
                <div className="product-detail__head">
                    <div>
                        <span className="product-detail__eyebrow">Producto</span>
                        <h2>{product.name}</h2>
                    </div>
                    <button type="button" className="btn-secondary" onClick={onClose}>
                        Cerrar
                    </button>
                </div>

                <div className="product-detail__summary">
                    <div>
                        <span>Mejor precio</span>
                        <strong className="amount-font text-success">
                            {formatCurrency(product.bestPrice)}
                        </strong>
                    </div>
                    <div>
                        <span>Promedio</span>
                        <strong className="amount-font">{formatCurrency(product.averagePrice)}</strong>
                    </div>
                    <div>
                        <span>Última compra</span>
                        <strong className="amount-font">{formatCurrency(product.lastPrice)}</strong>
                    </div>
                    <div>
                        <span>Compras</span>
                        <strong className="amount-font">{product.purchaseCount}</strong>
                    </div>
                </div>

                <div className="product-detail__best">
                    <Store size={15} />
                    <span>
                        Mejor precio en{" "}
                        <strong>{product.bestMerchantName ?? "Establecimiento no registrado"}</strong>
                        {product.bestMerchantAddress ? ` · ${product.bestMerchantAddress}` : ""}
                        {product.bestDate ? ` · ${formatDate(product.bestDate)}` : ""}
                    </span>
                </div>

                {isLoading && <p className="text-muted">Cargando historial…</p>}
                {isError && <p className="text-muted">No se pudo cargar el historial.</p>}

                {data && (
                    <div className="product-detail__table-wrap">
                        <table className="product-detail__table">
                            <thead>
                                <tr>
                                    <th>Establecimiento</th>
                                    <th>Fecha</th>
                                    <th>Cant.</th>
                                    <th>Precio unit.</th>
                                    <th>Total</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.prices.map((price, index) => (
                                    <tr key={`${price.transactionId}-${index}`}>
                                        <td>
                                            <div className="product-detail__merchant">
                                                <strong>{price.merchantName ?? "Sin establecimiento"}</strong>
                                                {price.merchantAddress && (
                                                    <span>{price.merchantAddress}</span>
                                                )}
                                            </div>
                                        </td>
                                        <td>{formatDate(price.date)}</td>
                                        <td>{price.quantity}</td>
                                        <td>
                                            <span
                                                className={
                                                    price.unitPrice === data.bestPrice
                                                        ? "product-detail__price is-best"
                                                        : "product-detail__price"
                                                }
                                            >
                                                {formatCurrency(price.unitPrice)}
                                            </span>
                                        </td>
                                        <td>{formatCurrency(price.total)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </ModalPortal>
    );
}

export default function ProductsPage() {
    const [search, setSearch] = useState("");
    const [order, setOrder] = useState<NonNullable<ProductQuery["order"]>>("recent");
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<ProductSummary | null>(null);

    const query = useMemo<ProductQuery>(
        () => ({
            search: search.trim() || undefined,
            order,
            page,
            limit: 24,
        }),
        [search, order, page]
    );

    const { products, meta, loading, isError, error, refetch } = useProducts(query);

    const handleSearch = (value: string) => {
        setSearch(value);
        setPage(1);
    };

    if (loading) return <LoadingScreen message="Cargando productos..." />;

    if (isError) {
        return (
            <div className="page-container products-page">
                <div className="card products-error">
                    <PackageSearch size={28} />
                    <p>No se pudieron cargar los productos.</p>
                    <p className="text-muted">{error?.message ?? "Error inesperado"}</p>
                    <button type="button" className="btn-primary" onClick={() => refetch()}>
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="page-container products-page">
            <header className="page-header card products-header">
                <div>
                    <h1>Productos</h1>
                    <p className="text-muted">
                        Compara precios de tus productos y descubre dónde te conviene comprar.
                    </p>
                </div>

                <div className="products-toolbar">
                    <SearchInput
                        value={search}
                        onChange={handleSearch}
                        placeholder="Buscar producto..."
                    />
                    <SelectInput
                        compact
                        label="Ordenar"
                        hideLabel
                        value={order}
                        onChange={(value) => {
                            setOrder(value as NonNullable<ProductQuery["order"]>);
                            setPage(1);
                        }}
                        options={ORDER_OPTIONS}
                        className="products-sort"
                    />
                </div>
            </header>

            {products.length === 0 ? (
                <div className="card products-empty">
                    <PackageSearch size={30} />
                    <p>
                        {search
                            ? `No se encontraron productos para «${search}».`
                            : "Aún no tienes productos registrados."}
                    </p>
                    <p className="text-muted">
                        Agrega productos al crear una transacción o al escanear una boleta.
                    </p>
                </div>
            ) : (
                <div className="products-grid">
                    {products.map((product) => (
                        <button
                            key={product.normalizedName}
                            type="button"
                            className="product-card card tooltip-top"
                            onClick={() => setSelected(product)}
                            data-tooltip="Ver historial de precios"
                        >
                            <div className="product-card__top">
                                <span className="product-card__icon">
                                    <PackageSearch size={18} />
                                </span>
                                <div className="product-card__title">
                                    <strong>{product.name}</strong>
                                    <span>{product.purchaseCount} compra{product.purchaseCount === 1 ? "" : "s"}</span>
                                </div>
                            </div>

                            <div className="product-card__price">
                                <span>Mejor precio</span>
                                <strong className="amount-font text-success">
                                    {formatCurrency(product.bestPrice)}
                                </strong>
                            </div>

                            <div className="product-card__merchant">
                                <Store size={13} />
                                <span>
                                    {product.bestMerchantName ?? "Establecimiento no registrado"}
                                    {product.bestMerchantAddress ? ` · ${product.bestMerchantAddress}` : ""}
                                </span>
                            </div>

                            <div className="product-card__meta">
                                <span>Promedio {formatCurrency(product.averagePrice)}</span>
                                <span>Última {formatDate(product.lastDate)}</span>
                            </div>

                            {product.lastPrice > product.bestPrice && (
                                <span className="product-card__savings">
                                    <TrendingDown size={12} />
                                    Ahorras {formatCurrency(product.lastPrice - product.bestPrice)}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {meta && meta.totalPages > 1 && (
                <div className="tf-pagination">
                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={page <= 1}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                    >
                        ← Anterior
                    </button>
                    <span className="tf-page-info">
                        Página {meta.page}/{meta.totalPages}
                    </span>
                    <button
                        type="button"
                        className="btn-secondary"
                        disabled={page >= meta.totalPages}
                        onClick={() => setPage((current) => current + 1)}
                    >
                        Siguiente →
                    </button>
                </div>
            )}

            {selected && (
                <ProductDetailModal product={selected} onClose={() => setSelected(null)} />
            )}
        </div>
    );
}
