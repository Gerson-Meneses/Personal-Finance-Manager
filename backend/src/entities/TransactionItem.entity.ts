import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    ManyToOne,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { Transaction } from "./Transaction.entity";
import type { User } from "./User.entity";

@Entity({ name: "transaction_items" })
@Index("IDX_transaction_items_transaction", ["transaction"])
@Index("IDX_transaction_items_user_normalized", ["user", "normalizedName"])
export class TransactionItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 255, nullable: false })
    name: string;

    /** Nombre normalizado para agrupar el mismo producto entre compras. */
    @Column({ type: "varchar", length: 255, nullable: false })
    normalizedName: string;

    /** Comentario o descripción opcional de esta compra. */
    @Column({ type: "varchar", length: 500, nullable: true })
    description?: string | null;

    /** Cantidad comprada (admite decimales, ej. 0.750 kg). */
    @Column({ type: "numeric", precision: 10, scale: 3, default: 1 })
    quantity: string;

    /** Precio unitario en centavos. */
    @Column({ type: "integer", nullable: false })
    unitPrice: number;

    /** Total de la línea en centavos. */
    @Column({ type: "integer", nullable: false })
    total: number;

    @ManyToOne("Transaction", "items", { nullable: false, onDelete: "CASCADE" })
    transaction: Transaction;

    @ManyToOne("User", "transactionItems", { nullable: false, onDelete: "CASCADE" })
    user: User;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
