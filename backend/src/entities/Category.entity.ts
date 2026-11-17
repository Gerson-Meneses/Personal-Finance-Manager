import { Entity, Index, JoinColumn, ManyToOne, OneToMany } from "typeorm";
import { PrimaryGeneratedColumn, Column } from "typeorm"
import { TypeTransaction } from "../utils/Enums";
import type { User } from "./User.entity";
import { Transaction } from "./Transaction.entity";
import { ReccurentTransaction } from "./ReccurentTransaction.entity";

@Entity({
    name: "categories",
})
@Index('IDX_categories_user', ['user'])
export class Category {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ type: "varchar", length: 100, nullable: false })
    name: string;

    @Column({
        type: "enum",
        enum: TypeTransaction
    })
    type: TypeTransaction;

    @Column({ type: "varchar", length: 9, default: "#FFFFFF" })
    color: string;

    @Column({ type: "varchar", length: 500, nullable: true })
    icon: string;

    @Column({ default: false })
    isBase: boolean

    @Column({ default: true })
    visible: boolean

    /** Categoría padre opcional: permite un nivel de subcategorías. */
    @Column({ type: "uuid", nullable: true })
    parentCategoryId: string | null

    @ManyToOne(() => Category, (category) => category.children, {
        nullable: true,
        onDelete: "SET NULL",
    })
    @JoinColumn({ name: "parentCategoryId" })
    parentCategory: Category | null

    @OneToMany(() => Category, (category) => category.parentCategory)
    children: Category[]

    @ManyToOne("User", "categories", { nullable: false })
    user: User;

    @OneToMany(() => Transaction, transaction => transaction.category)
    transactions: Transaction[];

    @OneToMany(() => ReccurentTransaction, reccurentTransaction => reccurentTransaction.category)
    reccurentTransactions: ReccurentTransaction[];
}