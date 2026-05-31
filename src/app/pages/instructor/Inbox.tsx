import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Search,
  User,
  BookOpen,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function InstructorInbox() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [replyDialogOpen, setReplyDialogOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadMessages();
  }, [activeTab]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      const filters: any = {};
      if (activeTab === 'unread') {
        filters.unread_only = true;
      }
      if (activeTab === 'academe') {
        filters.enrollment_type = 'academe_student';
      }
      if (activeTab === 'certificatory') {
        filters.enrollment_type = 'certificatory';
      }

      const result = await apiV2.Instructor.getMessages(filters);
      setMessages(result.messages);
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenReply = async (message: any) => {
    setSelectedMessage(message);
    setReplyText('');
    setReplyDialogOpen(true);

    // Mark as read
    if (message.status === 'unread') {
      try {
        await apiV2.Instructor.markMessageAsRead(message.id);
        await loadMessages();
      } catch (error: any) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim()) {
      toast.error('Please enter a reply message');
      return;
    }

    if (!selectedMessage) return;

    setSubmitting(true);
    try {
      await apiV2.Instructor.sendMessage({
        student_id: selectedMessage.student_id || selectedMessage.id,
        parent_message_id: selectedMessage.id,
        message: replyText
      });

      toast.success('Reply sent successfully!');
      setReplyDialogOpen(false);
      setSelectedMessage(null);
      setReplyText('');
      await loadMessages();
    } catch (error: any) {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    if (searchQuery && !msg.studentName.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !msg.subject.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (activeTab === 'academe' && msg.studentType !== 'academe') return false;
    if (activeTab === 'certificatory' && msg.studentType !== 'certificatory') return false;
    if (activeTab === 'unread' && msg.status !== 'unread') return false;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading inbox...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/instructor/dashboard')}
          className="gap-2 mb-4"
          style={{ color: 'var(--royal-blue)' }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
              <MessageSquare className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Instructor Support Inbox</h1>
              <p className="text-white/70">Direct messaging and Q&A from enrolled students</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Tabs */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--card)' }}>
        <CardContent className="pt-6">
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input
              placeholder="Search messages by student name or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all">All Messages</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="academe">Academe</TabsTrigger>
              <TabsTrigger value="certificatory">Certificatory</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <CardTitle style={{ color: 'var(--royal-blue)' }}>Messages</CardTitle>
          <CardDescription>
            {filteredMessages.length} message{filteredMessages.length !== 1 ? 's' : ''}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ color: 'var(--muted-foreground)' }}>No messages found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map(message => (
                <div key={message.id} className="border-2 p-4 hover:shadow-md transition-all" style={{
                  borderColor: message.status === 'unread' ? 'var(--royal-blue-light)' : 'var(--border)',
                  background: message.status === 'unread' ? 'var(--accent-blue-50)' : 'var(--card)',
                  borderRadius: 'var(--radius-lg)'
                }}>
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 flex items-center justify-center" style={{
                        background: message.studentType === 'academe' ? 'var(--accent-blue-50)' : 'var(--accent-gold-50)',
                        borderRadius: 'var(--radius-lg)'
                      }}>
                        <User className="h-5 w-5" style={{ color: message.studentType === 'academe' ? 'var(--royal-blue)' : 'var(--gold)' }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{message.studentName}</p>
                        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{message.studentEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge style={{
                        background: message.studentType === 'academe' ? 'var(--accent-blue-50)' : 'var(--accent-gold-50)',
                        color: message.studentType === 'academe' ? 'var(--royal-blue)' : 'var(--gold)'
                      }}>
                        {message.studentType === 'academe' ? `Academe • ${message.classCode}` : 'Certificatory'}
                      </Badge>
                      {message.status === 'unread' && (
                        <Badge style={{ background: 'var(--royal-blue)', color: 'white' }}>New</Badge>
                      )}
                    </div>
                  </div>

                  {/* Course Info */}
                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <BookOpen className="h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
                    <span style={{ color: 'var(--muted-foreground)' }}>Course:</span>
                    <span className="font-medium" style={{ color: 'var(--foreground)' }}>{message.courseName}</span>
                  </div>

                  {/* Message Content */}
                  <div className="mb-3">
                    <p className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>{message.subject}</p>
                    <p className="text-sm line-clamp-2" style={{ color: 'var(--muted-foreground)' }}>{message.message}</p>
                  </div>

                  {/* Timestamp & Actions */}
                  <div className="flex items-center justify-between pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock className="h-3 w-3" />
                      {new Date(message.timestamp).toLocaleString()}
                    </div>
                    <Button size="sm" className="gap-2" onClick={() => handleOpenReply(message)}>
                      <MessageSquare className="h-4 w-4" />
                      {message.status === 'replied' ? 'View Thread' : 'Reply'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Reply Dialog */}
      <Dialog open={replyDialogOpen} onOpenChange={setReplyDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--royal-blue)' }}>Message Thread</DialogTitle>
            <DialogDescription>Conversation with {selectedMessage?.studentName}</DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4 py-4">
              {/* Student Info */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                <p className="font-semibold" style={{ color: 'var(--royal-blue)' }}>{selectedMessage.studentName}</p>
                <p className="text-sm" style={{ color: 'var(--royal-blue-light)' }}>{selectedMessage.studentEmail}</p>
                <p className="text-sm" style={{ color: 'var(--royal-blue-light)' }}>
                  {selectedMessage.courseName} • {selectedMessage.studentType === 'academe' ? selectedMessage.classCode : 'Certificatory'}
                </p>
              </div>

              {/* Original Message */}
              <div>
                <p className="text-sm font-medium mb-2" style={{ color: 'var(--muted-foreground)' }}>
                  {new Date(selectedMessage.timestamp).toLocaleString()}
                </p>
                <div className="p-4 rounded-lg" style={{ background: 'var(--muted)' }}>
                  <p className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>{selectedMessage.subject}</p>
                  <p className="text-sm" style={{ color: 'var(--foreground)' }}>{selectedMessage.message}</p>
                </div>
              </div>

              {/* Previous Replies */}
              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Previous Replies:</p>
                  {selectedMessage.replies.map((reply: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-lg" style={{ background: 'var(--accent-green-50)' }}>
                      <p className="text-xs mb-1" style={{ color: 'var(--success)' }}>
                        {reply.from === 'instructor' ? 'You' : reply.from} • {new Date(reply.timestamp).toLocaleString()}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>{reply.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <div>
                <label className="text-sm font-medium mb-2 block" style={{ color: 'var(--foreground)' }}>Your Reply</label>
                <Textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={5}
                  placeholder="Type your reply here..."
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                setReplyDialogOpen(false);
                setSelectedMessage(null);
              }}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendReply}
              disabled={submitting || !replyText.trim()}
              className="gap-2"
              style={{ background: 'var(--royal-blue)', color: 'white' }}
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Sending...' : 'Send Reply'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
