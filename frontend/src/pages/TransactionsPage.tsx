import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTransactions, refundTransaction, checkPermission, getTransactionById } from '../services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search, RefreshCw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import useAuth from '@/hooks/useAuth';

const formatDate = (dateString: string | number | Date) => {
    return new Date(dateString).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
    }).format(amount || 0);
};

const TransactionsPage = () => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);
    const [refundReason, setRefundReason] = useState('');
    const [showRefundDialog, setShowRefundDialog] = useState(false);

    const {
        data: transactions,
        isLoading,
        isError,
        error,
        refetch,
    } = useQuery({
        queryKey: ['transactions', searchTerm],
        queryFn: () => getTransactions({ search: searchTerm }),
    });

    const { data: transactionDetails } = useQuery({
        queryKey: ['transactionDetails', selectedTransactionId],
        queryFn: () => getTransactionById(selectedTransactionId!),
        enabled: !!selectedTransactionId,
    });

    const refundMutation = useMutation({
        mutationFn: (refundData: { reason: string; processedBy: string }) =>
            refundTransaction(selectedTransactionId!, refundData),
        onSuccess: () => {
            queryClient.invalidateQueries(['transactions']);
            setShowRefundDialog(false);
            setSelectedTransactionId(null);
            setRefundReason('');
        },
    });

    const handleRefundClick = (transactionId: string) => {
        if (!checkPermission(currentUser, 'transactions', 'refund')) {
            alert('You are not authorized to process refunds');
            return;
        }
        setSelectedTransactionId(transactionId);
        setShowRefundDialog(true);
    };

    const handleRefundSubmit = () => {
        if (!refundReason.trim()) return;
        refundMutation.mutate({
            reason: refundReason,
            processedBy: currentUser?.username || 'admin',
        });
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'default';
            case 'refunded': return 'destructive';
            case 'pending': return 'secondary';
            default: return 'outline';
        }
    };

    return (
        <div className="p-4 space-y-4">
            {/* Minimal Header */}
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-semibold">Transactions</h1>
                <div className="flex space-x-2">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search transactions..."
                            className="pl-9 w-[200px]"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon" onClick={() => refetch()}>
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Transactions Table */}
            {isError && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        {error?.message || 'Failed to load transactions'}
                    </AlertDescription>
                </Alert>
            )}

            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[120px]">ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead>Method</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    Loading...
                                </TableCell>
                            </TableRow>
                        ) : transactions?.transactions?.length > 0 ? (
                            transactions.transactions.map((transaction) => (
                                <TableRow key={transaction.id}>
                                    <TableCell className="font-medium">{transaction.receiptNumber}</TableCell>
                                    <TableCell>{formatDate(transaction.transactionDate)}</TableCell>
                                    <TableCell>{transaction.payerName}</TableCell>
                                    <TableCell className="text-right">
                                        {formatCurrency(transaction.amount, transaction.currency)}
                                    </TableCell>
                                    <TableCell>{transaction.paymentMethod || 'Card'}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusBadgeVariant(transaction.status)}>
                                            {transaction.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right space-x-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSelectedTransactionId(transaction.id)}
                                        >
                                            Details
                                        </Button>
                                        {transaction.status === 'completed' && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 border-red-200"
                                                onClick={() => handleRefundClick(transaction.id)}
                                            >
                                                Refund
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={7} className="h-24 text-center">
                                    No transactions found
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Transaction Details Dialog */}
            <Dialog open={!!selectedTransactionId} onOpenChange={(open) => !open && setSelectedTransactionId(null)}>
                <DialogContent className="sm:max-w-[600px]">
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                    </DialogHeader>
                    {transactionDetails && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Transaction ID</Label>
                                    <p>{transactionDetails.receiptNumber}</p>
                                </div>
                                <div>
                                    <Label>Date</Label>
                                    <p>{formatDate(transactionDetails.transactionDate)}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Customer</Label>
                                    <p>{transactionDetails.payerName}</p>
                                </div>
                                <div>
                                    <Label>Payment Method</Label>
                                    <p>{transactionDetails.paymentMethod || 'Card'}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label>Amount</Label>
                                    <p className="font-medium">
                                        {formatCurrency(transactionDetails.amount, transactionDetails.currency)}
                                    </p>
                                </div>
                                <div>
                                    <Label>Status</Label>
                                    <Badge variant={getStatusBadgeVariant(transactionDetails.status)}>
                                        {transactionDetails.status}
                                    </Badge>
                                </div>
                            </div>
                            {transactionDetails.refundReason && (
                                <div>
                                    <Label>Refund Reason</Label>
                                    <p>{transactionDetails.refundReason}</p>
                                </div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Refund Dialog */}
            <Dialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Process Refund</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <Label htmlFor="reason">Reason</Label>
                            <Textarea
                                id="reason"
                                value={refundReason}
                                onChange={(e) => setRefundReason(e.target.value)}
                                placeholder="Enter refund reason..."
                            />
                        </div>
                    </div>
                    <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowRefundDialog(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleRefundSubmit}
                            disabled={!refundReason.trim() || refundMutation.isLoading}
                        >
                            {refundMutation.isLoading ? 'Processing...' : 'Confirm Refund'}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default TransactionsPage;