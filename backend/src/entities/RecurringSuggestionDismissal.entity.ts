import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
    Unique,
} from "typeorm";
import type { User } from "./User.entity";

@Entity({ name: "recurring_suggestion_dismissals" })
@Unique("UQ_recurring_suggestion_dismissal", ["userId", "suggestionId"])
@Index("IDX_recurring_suggestion_dismissals_user", ["userId"])
export class RecurringSuggestionDismissal {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @Column({ type: "varchar", length: 200 })
    suggestionId: string;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
}
