import {
    Column,
    CreateDateColumn,
    Entity,
    Index,
    JoinColumn,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import type { Account } from "./Account.entity";
import type { User } from "./User.entity";
import { CreditDocumentType } from "../utils/Enums";

@Entity({ name: "credit_card_documents" })
@Index("IDX_credit_card_documents_account", ["account"])
@Index("IDX_credit_card_documents_user", ["user"])
export class CreditCardDocument {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne("Account", "creditDocuments", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "accountId" })
    account: Account;

    @Column({ type: "uuid" })
    accountId: string;

    @ManyToOne("User", { nullable: false, onDelete: "CASCADE" })
    @JoinColumn({ name: "userId" })
    user: User;

    @Column({ type: "uuid" })
    userId: string;

    @Column({ type: "varchar", length: 255 })
    fileName: string;

    @Column({ type: "varchar", length: 120 })
    mimeType: string;

    @Column({ type: "integer" })
    size: number;

    @Column({ type: "bytea" })
    data: Buffer;

    @Column({
        type: "enum",
        enum: CreditDocumentType,
        enumName: "credit_document_type_enum",
        default: CreditDocumentType.CONTRACT,
    })
    type: CreditDocumentType;

    @Column({ type: "jsonb", nullable: true })
    extractedData?: Record<string, unknown> | null;

    @CreateDateColumn({ type: "timestamp" })
    createdAt: Date;
}
