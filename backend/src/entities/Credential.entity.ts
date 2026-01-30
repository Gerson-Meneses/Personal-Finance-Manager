import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import type { User } from "./User.entity";

@Entity(
    { name: 'credentials' }
)
export class Credential {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column({
        select: false
    })
    password: string;

    @OneToOne("User", "credential")
    user: User;
}