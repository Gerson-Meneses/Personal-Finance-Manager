import { Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import type { User } from "./User.entity";
import { TypeCode } from "../utils/Enums";

@Entity({ name: "codes" })
@Index('IDX_codes_user_type', ['user', 'type'])
export class Codes {
    @PrimaryGeneratedColumn("uuid")
    id: string

    @Column()
    hash_code: string

    @Column({
        type: "int",
        default: 0
    })
    attemps: number

    @Column("timestamp")
    expired_at: Date

    @Column({
        type: "boolean",
        default: false
    })
    used: boolean

    @Column({ nullable: true })
    ip_validation_address?: string

    @Column({ nullable: true })
    ip_address?: string

    @Column({
        type: "enum",
        enum: TypeCode,
        enumName: "Type_Code"
    })
    type: TypeCode

    @CreateDateColumn({ type: 'timestamp' })
    createdAt: Date

    @ManyToOne("User", "codes")
    user: User
}