import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Label } from '../../components/ui/label';
import {
  ArrowLeft,
  MessageSquare,
  Send,
  Search,
  Plus,
  BookOpen,
  Clock,
  User,
  Archive
} from 'lucide-react';
import { toast } from 'sonner';
import * as apiV2 from '../../lib/api-v2';

export function StudentMessages() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [messages, setMessages] = useState<any[]>([]);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any | null>(null);
  const [newMessageOpen, setNewMessageOpen] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [archivedIds, setArchivedIds] = useState<Set<string>>(new Set());
  const [showArchived, setShowArchived] = useState(false);

  // New message form
  const [newSubject, setNewSubject] = useState('');
  const [newCourseId, setNewCourseId] = useState('');
  const [newMessageText, setNewMessageText] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [messagesResult, enrollmentsResult] = await Promise.all([
        apiV2.Student.getMessages(),
        apiV2.Student.getMyEnrollments()
      ]);

      setMessages(messagesResult.messages);
      setEnrollments(enrollmentsResult.enrollments.filter((e: any) => !e.is_expired));
    } catch (error: any) {
      console.error('Failed to load messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMessage = async (message: any) => {
    setSelectedMessage(message);
    setReplyText('');

    // Mark as read if unread
    if (message.status === 'unread') {
      try {
        await apiV2.Student.markMessageAsRead(message.id);
        await loadData();
      } catch (error: any) {
        console.error('Failed to mark as read:', error);
      }
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedMessage) {
      toast.error('Please enter a reply');
      return;
    }

    setSubmitting(true);
    try {
      await apiV2.Student.sendMessage({
        course_id: selectedMessage.course_id,
        parent_message_id: selectedMessage.id,
        message: replyText.trim()
      });

      toast.success('Reply sent!');
      setReplyText('');
      await loadData();

      // Refresh selected message to show new reply
      const updated = messages.find(m => m.id === selectedMessage.id);
      if (updated) {
        setSelectedMessage(updated);
      }
    } catch (error: any) {
      toast.error('Failed to send reply');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendNewMessage = async () => {
    if (!newSubject.trim() || !newMessageText.trim() || !newCourseId) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      await apiV2.Student.sendMessage({
        course_id: newCourseId,
        subject: newSubject.trim(),
        message: newMessageText.trim()
      });

      toast.success('Message sent to instructor!');
      setNewMessageOpen(false);
      setNewSubject('');
      setNewCourseId('');
      setNewMessageText('');
      await loadData();
    } catch (error: any) {
      toast.error('Failed to send message');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMessages = messages.filter(msg => {
    const isArchived = archivedIds.has(String(msg.id));
    if (!showArchived && isArchived) return false;
    if (showArchived && !isArchived) return false;
    if (!searchQuery) return true;
    const search = searchQuery.toLowerCase();
    return (
      msg.subject?.toLowerCase().includes(search) ||
      msg.course?.title?.toLowerCase().includes(search) ||
      msg.message?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[var(--royal-blue)] border-r-transparent"></div>
          <p className="mt-4" style={{ color: 'var(--muted-foreground)' }}>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="p-6 shadow-xl" style={{
          background: 'linear-gradient(to right, var(--royal-blue-darker), var(--royal-blue), var(--royal-blue-light))',
          borderRadius: 'var(--radius-xl)',
          borderBottom: '3px solid var(--gold)'
        }}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center" style={{ background: 'var(--gold)', borderRadius: 'var(--radius-lg)' }}>
                <MessageSquare className="h-6 w-6" style={{ color: 'var(--royal-blue)' }} />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Instructor Support</h1>
                <p className="text-white/70">Ask questions about your courses</p>
              </div>
            </div>
            <Button
              onClick={() => setNewMessageOpen(true)}
              className="gap-2 bg-white"
              style={{ color: 'var(--royal-blue)' }}
            >
              <Plus className="h-4 w-4" />
              New Message
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card className="border-0 shadow-lg mb-6" style={{ background: 'var(--card)' }}>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'var(--muted-foreground)' }} />
            <Input
              placeholder="Search messages by subject or course..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Messages List */}
      <Card className="border-0 shadow-lg" style={{ background: 'var(--card)' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle style={{ color: 'var(--royal-blue)' }}>
                {showArchived ? 'Archived Messages' : 'Messages'}
              </CardTitle>
              <CardDescription>
                {filteredMessages.length} conversation{filteredMessages.length !== 1 ? 's' : ''}
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowArchived(!showArchived)}
              className="gap-2"
            >
              <Archive className="h-4 w-4" />
              {showArchived ? 'Show Active' : 'Archived'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMessages.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="h-12 w-12 mx-auto mb-3" style={{ color: 'var(--muted-foreground)' }} />
              <p style={{ color: 'var(--muted-foreground)' }}>No messages found</p>
              <Button
                onClick={() => setNewMessageOpen(true)}
                className="mt-4 gap-2"
                style={{ background: 'var(--royal-blue)', color: 'white' }}
              >
                <Plus className="h-4 w-4" />
                Send Your First Message
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => handleOpenMessage(message)}
                  className="border-2 p-4 rounded-lg cursor-pointer hover:shadow-md transition-all"
                  style={{
                    borderColor: message.status === 'unread' ? 'var(--royal-blue-light)' : 'var(--border)',
                    background: message.status === 'unread' ? 'var(--accent-blue-50)' : 'var(--card)'
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 flex items-center justify-center" style={{
                        background: message.enrollment_type === 'academe_student' ? 'var(--accent-blue-50)' : 'var(--accent-gold-50)',
                        borderRadius: 'var(--radius-lg)'
                      }}>
                        <User className="h-5 w-5" style={{
                          color: message.enrollment_type === 'academe_student' ? 'var(--royal-blue)' : 'var(--gold)'
                        }} />
                      </div>
                      <div>
                        <p className="font-semibold" style={{ color: 'var(--foreground)' }}>
                          {message.subject}
                        </p>
                        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          <BookOpen className="h-3 w-3" />
                          {message.course?.title}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {message.status === 'unread' && (
                        <Badge style={{ background: 'var(--royal-blue)', color: 'white' }}>New</Badge>
                      )}
                      <Badge style={{
                        background: message.enrollment_type === 'academe_student' ? 'var(--accent-blue-50)' : 'var(--accent-gold-50)',
                        color: message.enrollment_type === 'academe_student' ? 'var(--royal-blue)' : 'var(--gold)'
                      }}>
                        {message.enrollment_type === 'academe_student' ? 'Student' : 'Certificatory Client'}
                      </Badge>
                    </div>
                  </div>

                  <p className="text-sm line-clamp-2 mb-2" style={{ color: 'var(--muted-foreground)' }}>
                    {message.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                      <Clock className="h-3 w-3" />
                      {new Date(message.created_at).toLocaleString()}
                    </div>
                    <div className="flex items-center gap-2">
                      {message.replies && message.replies.length > 0 && (
                        <span className="text-xs" style={{ color: 'var(--royal-blue)' }}>
                          {message.replies.length} {message.replies.length === 1 ? 'reply' : 'replies'}
                        </span>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs"
                        style={{ color: 'var(--muted-foreground)' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setArchivedIds(prev => {
                            const next = new Set(prev);
                            if (next.has(String(message.id))) next.delete(String(message.id));
                            else next.add(String(message.id));
                            return next;
                          });
                        }}
                      >
                        <Archive className="h-3 w-3" />
                        {archivedIds.has(String(message.id)) ? 'Unarchive' : 'Archive'}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Message Thread Dialog */}
      <Dialog open={!!selectedMessage} onOpenChange={(open) => !open && setSelectedMessage(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--royal-blue)' }}>
              {selectedMessage?.subject}
            </DialogTitle>
            <DialogDescription>
              {selectedMessage?.course?.title}
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4 py-4">
              {/* Original Message */}
              <div className="p-4 rounded-lg" style={{ background: 'var(--accent-blue-50)' }}>
                <div className="flex items-start justify-between mb-2">
                  <p className="text-sm font-semibold" style={{ color: 'var(--royal-blue)' }}>You</p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {new Date(selectedMessage.created_at).toLocaleString()}
                  </p>
                </div>
                <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                  {selectedMessage.message}
                </p>
              </div>

              {/* Replies */}
              {selectedMessage.replies && selectedMessage.replies.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold" style={{ color: 'var(--muted-foreground)' }}>Replies:</p>
                  {selectedMessage.replies.map((reply: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-4 rounded-lg"
                      style={{
                        background: reply.from === 'instructor' ? 'var(--accent-gold-50)' : 'var(--accent-blue-50)'
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <p className="text-sm font-semibold" style={{
                          color: reply.from === 'instructor' ? 'var(--gold)' : 'var(--royal-blue)'
                        }}>
                          {reply.from === 'instructor' ? 'Instructor' : 'You'}
                        </p>
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {new Date(reply.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <p className="text-sm" style={{ color: 'var(--foreground)' }}>
                        {reply.message}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <div>
                <Label htmlFor="reply-text">Your Reply</Label>
                <Textarea
                  id="reply-text"
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  rows={4}
                  placeholder="Type your reply here..."
                  className="mt-2"
                />
              </div>
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedMessage(null)}
              disabled={submitting}
            >
              Close
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

      {/* New Message Dialog */}
      <Dialog open={newMessageOpen} onOpenChange={setNewMessageOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle style={{ color: 'var(--royal-blue)' }}>
              New Message to Instructor
            </DialogTitle>
            <DialogDescription>
              Ask a question about your course
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="new-course">Select Course *</Label>
              <Select value={newCourseId} onValueChange={setNewCourseId}>
                <SelectTrigger id="new-course" className="mt-2">
                  <SelectValue placeholder="Choose a course..." />
                </SelectTrigger>
                <SelectContent>
                  {enrollments.map((enrollment) => (
                    <SelectItem key={enrollment.id} value={enrollment.course_id}>
                      {enrollment.course?.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="new-subject">Subject *</Label>
              <Input
                id="new-subject"
                value={newSubject}
                onChange={(e) => setNewSubject(e.target.value)}
                placeholder="e.g., Question about Module 2"
                className="mt-2"
              />
            </div>

            <div>
              <Label htmlFor="new-message">Message *</Label>
              <Textarea
                id="new-message"
                value={newMessageText}
                onChange={(e) => setNewMessageText(e.target.value)}
                rows={6}
                placeholder="Type your message here..."
                className="mt-2"
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={() => setNewMessageOpen(false)}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendNewMessage}
              disabled={submitting || !newSubject.trim() || !newMessageText.trim() || !newCourseId}
              className="gap-2"
              style={{ background: 'var(--royal-blue)', color: 'white' }}
            >
              <Send className="h-4 w-4" />
              {submitting ? 'Sending...' : 'Send Message'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
