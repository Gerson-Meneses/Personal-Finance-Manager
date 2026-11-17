import { useMemo } from "react";
import dayjs from "dayjs";
import { useContacts } from "../contacts/hooks";
import { useLoansQuery, useLoanSummary } from "../loans/hooks";
import { useDebtInstallments } from "../loans/debtHooks";
import type { DebtInstallmentItem } from "../loans/planTypes";
import type { Loan, LoanSummaryGrouped } from "../loans/types";
import type { Contact } from "../contacts/types";
import type { ContactDebtRow, DebtHub, DebtHubSummary } from "./types";

const contactKey = (loan: Loan) => loan.contact?.id ?? loan.lender;

const sumRemaining = (summary: LoanSummaryGrouped | undefined, type: "GIVEN" | "RECEIVED") =>
    summary?.byType[type]?.totalRemaining ?? 0;

const overdueInstallments = (installments: DebtInstallmentItem[]) =>
    installments.filter((item) => item.status === "OVERDUE");

export const useDebtHub = () => {
    const currentMonth = dayjs().format("YYYY-MM");
    const contactsQuery = useContacts();
    const summaryQuery = useLoanSummary({ status: "PENDING" });
    const loansQuery = useLoansQuery({ status: "PENDING", limit: 500 });
    const installmentsQuery = useDebtInstallments(currentMonth);

    const data = useMemo<DebtHub>(() => {
        const contacts = contactsQuery.contacts;
        const summaries = summaryQuery.summary;
        const loans = loansQuery.loans;
        const installments = installmentsQuery.installments;

        const contactsById = new Map(contacts.map((contact) => [contact.id, contact]));
        const contactsByName = new Map(
            contacts.map((contact) => [contact.name.trim().toLowerCase(), contact])
        );
        const summaryByKey = new Map(
            summaries.map((summary) => [summary.contactId ?? summary.lender, summary])
        );
        const loansByKey = new Map<string, Loan[]>();
        const installmentsByKey = new Map<string, DebtInstallmentItem[]>();

        for (const loan of loans) {
            const key = contactKey(loan);
            loansByKey.set(key, [...(loansByKey.get(key) ?? []), loan]);
        }

        for (const installment of installments) {
            const key = installment.contact?.id ?? installment.loan?.lender;
            if (!key) continue;
            installmentsByKey.set(key, [...(installmentsByKey.get(key) ?? []), installment]);
        }

        const keys = new Set<string>([
            ...contacts.map((contact) => contact.id),
            ...summaries.map((summary) => summary.contactId ?? summary.lender),
            ...loans.map(contactKey),
        ]);

        const rows: ContactDebtRow[] = [...keys].map((key) => {
            const summary = summaryByKey.get(key);
            const contact =
                contactsById.get(key) ??
                (summary ? contactsByName.get(summary.lender.trim().toLowerCase()) : undefined);
            const keyLoans = loansByKey.get(key) ?? [];
            const keyInstallments = installmentsByKey.get(key) ?? [];
            const given = sumRemaining(summary, "GIVEN");
            const received = sumRemaining(summary, "RECEIVED");
            const overdue = overdueInstallments(keyInstallments);
            const pendingDates = keyInstallments
                .filter((item) => item.status === "PENDING" || item.status === "PARTIAL")
                .map((item) => item.dueDate)
                .filter((date): date is string => Boolean(date))
                .sort();

            const loanCount = summary?.total.loanCount ?? keyLoans.length;
            const overdueCount = overdue.length > 0
                ? overdue.length
                : keyLoans.filter((loan) => loan.status === "OVERDUE").length;

            return {
                id: contact?.id ?? summary?.contactId ?? key,
                contactId: contact?.id ?? summary?.contactId ?? null,
                name: contact?.name ?? summary?.lender ?? keyLoans[0]?.lender ?? "Sin nombre",
                notes: contact?.notes ?? null,
                archived: contact?.archived ?? false,
                summary,
                loans: keyLoans,
                installments: keyInstallments,
                given,
                received,
                net: given - received,
                totalAmount:
                    summary?.total.totalAmount ??
                    keyLoans.reduce((sum, loan) => sum + loan.principalAmount, 0),
                totalPaid:
                    summary?.total.totalPaid ??
                    keyLoans.reduce((sum, loan) => sum + loan.amountPaid, 0),
                loanCount,
                overdueCount,
                nextDueDate: pendingDates[0] ?? null,
                contact,
            };
        });

        rows.sort((a, b) => {
            if (a.overdueCount !== b.overdueCount) return b.overdueCount - a.overdueCount;
            if (a.loanCount !== b.loanCount) return b.loanCount - a.loanCount;
            return b.net - a.net;
        });

        const activeLoans = rows.reduce((sum, row) => sum + row.loanCount, 0);
        const given = rows.reduce((sum, row) => sum + row.given, 0);
        const received = rows.reduce((sum, row) => sum + row.received, 0);
        const people = rows.filter((row) => row.loanCount > 0).length;
        const overdue = rows.reduce((sum, row) => sum + row.overdueCount, 0);

        const summary: DebtHubSummary = {
            given,
            received,
            net: given - received,
            activeLoans,
            people,
            overdue,
        };

        return {
            rows,
            loans: [...loans].sort((a, b) => b.amountRemaining - a.amountRemaining),
            installments,
            contacts,
            summary,
            currentMonth,
        };
    }, [
        contactsQuery.contacts,
        summaryQuery.summary,
        loansQuery.loans,
        installmentsQuery.installments,
        currentMonth,
    ]);

    const loading =
        (contactsQuery.loading && contactsQuery.contacts.length === 0) ||
        (summaryQuery.isLoading && summaryQuery.summary.length === 0) ||
        (loansQuery.isLoading && loansQuery.loans.length === 0) ||
        (installmentsQuery.loading && installmentsQuery.installments.length === 0);

    const error =
        contactsQuery.error ?? summaryQuery.error ?? loansQuery.error ?? installmentsQuery.error;

    const refetch = async () => {
        await Promise.all([
            contactsQuery.refetch(),
            summaryQuery.refetch(),
            loansQuery.refetch(),
            installmentsQuery.refetch(),
        ]);
    };

    return {
        hub: data,
        loading,
        error,
        refetch,
        contacts: contactsQuery.contacts as Contact[],
    };
};
