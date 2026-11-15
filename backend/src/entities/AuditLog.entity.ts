import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import type { User } from "./User.entity";

@Entity({ name: "audit_logs" })
@Index("IDX_audit_logs_user_entity", ["userId", "entityType", "entityId"])
export class AuditLog {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @Column({ type: "varchar", length: 50 })
    entityType: string;

    @Column({ type: "uuid" })
    entityId: string;

    @Column({ type: "varchar", length: 50 })
    action: string;

    @Column({ type: "jsonb", nullable: true })
    before?: Record<string, unknown> | null;

    @Column({ type: "jsonb", nullable: true })
    after?: Record<string, unknown> | null;

    @Column({ type: "text", nullable: true })
    reason?: string | null;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
}
