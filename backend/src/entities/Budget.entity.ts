import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
    UpdateDateColumn,
} from "typeorm";
import type { Category } from "./Category.entity";
import type { User } from "./User.entity";

@Entity({ name: "budgets" })
@Unique("UQ_budgets_user_category_month", ["userId", "categoryId", "month"])
@Index("IDX_budgets_user_month", ["userId", "month"])
export class Budget {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @ManyToOne("Category", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "categoryId" })
    category: Category;

    @Column({ type: "uuid" })
    categoryId: string;

    /** Formato YYYY-MM */
    @Column({ type: "varchar", length: 7 })
    month: string;

    /** Monto en centavos */
    @Column({ type: "integer" })
    amount: number;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
