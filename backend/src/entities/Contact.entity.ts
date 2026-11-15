import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    OneToMany,
    PrimaryGeneratedColumn,
    UpdateDateColumn,
} from "typeorm";
import type { User } from "./User.entity";
import type { Loan } from "./Loan.entity";

@Entity({ name: "contacts" })
@Index("IDX_contacts_user", ["userId"])
@Index("IDX_contacts_user_normalized", ["userId", "normalizedName"])
export class Contact {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @Column({ type: "varchar", length: 100 })
    name: string;

    @Column({ type: "varchar", length: 100 })
    normalizedName: string;

    @Column({ type: "text", nullable: true })
    notes?: string | null;

    @Column({ type: "boolean", default: false })
    archived: boolean;

    @OneToMany("Loan", "contact")
    loans: Loan[];

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;

    @UpdateDateColumn({ type: "timestamp" })
    updatedAt: Date;
}
