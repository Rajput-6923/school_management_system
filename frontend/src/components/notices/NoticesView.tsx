import React, { useState, useMemo } from 'react';
import { useSchool } from '../../context/SchoolApiContext';
import { SchoolNotice, NoticePriority, NoticeAudience } from '../../types';
import {
  Bell,
  Plus,
  Pin,
  Search,
  Calendar,
  Filter,
  Trash2,
  Edit2,
  Megaphone,
  AlertCircle,
  Eye,
} from 'lucide-react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';

export const NoticesView: React.FC = () => {
  const { notices, addNotice, updateNotice, deleteNotice, togglePinNotice, settings, isSaving, currentRole } = useSchool();

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [audienceFilter, setAudienceFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [noticeToEdit, setNoticeToEdit] = useState<SchoolNotice | null>(null);
  const [noticeToDelete, setNoticeToDelete] = useState<SchoolNotice | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'Academic' as SchoolNotice['category'],
    priority: 'Normal' as NoticePriority,
    targetAudience: 'All' as NoticeAudience,
    isPinned: false,
    authorName: settings.principalName,
  });

  const categories = ['Academic', 'Event', 'Holiday', 'Administrative', 'Sports'];

  const filteredNotices = useMemo(() => {
    return notices
      .filter((n) => {
        const matchSearch =
          `${n.title} ${n.content} ${n.authorName}`
            .toLowerCase()
            .includes(searchTerm.toLowerCase());

        const matchCat = categoryFilter === 'all' || n.category === categoryFilter;
        const matchAud = audienceFilter === 'all' || n.targetAudience === audienceFilter;

        return matchSearch && matchCat && matchAud;
      })
      .sort((a, b) => {
        // Pinned first, then by date descending
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime();
      });
  }, [notices, searchTerm, categoryFilter, audienceFilter]);

  const handleOpenAdd = () => {
    setNoticeToEdit(null);
    setFormData({
      title: '',
      content: '',
      category: 'Academic',
      priority: 'Normal',
      targetAudience: 'All',
      isPinned: false,
      authorName: settings.principalName,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (n: SchoolNotice) => {
    setNoticeToEdit(n);
    setFormData({
      title: n.title,
      content: n.content,
      category: n.category,
      priority: n.priority,
      targetAudience: n.targetAudience,
      isPinned: n.isPinned,
      authorName: n.authorName,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (noticeToEdit) {
      if (await updateNotice(noticeToEdit.id, formData)) setIsModalOpen(false);
    } else {
      if (await addNotice(formData)) setIsModalOpen(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search notices, announcements, circulars..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2">
            {(currentRole === 'Admin' || currentRole === 'Teacher') && <button
              onClick={handleOpenAdd}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Publish Notice</span>
            </button>}
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium mr-1">
            <Filter className="w-3.5 h-3.5" />
            <span>Category:</span>
          </div>

          <button
            onClick={() => setCategoryFilter('all')}
            className={`px-2.5 py-1 rounded-md transition-colors ${
              categoryFilter === 'all'
                ? 'bg-slate-900 text-white font-medium shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Categories ({notices.length})
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-2.5 py-1 rounded-md transition-colors ${
                categoryFilter === cat
                  ? 'bg-slate-900 text-white font-medium shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
            </button>
          ))}

          {/* Audience selector */}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-slate-500 font-medium">Audience:</span>
            <select
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
              className="px-2 py-1 text-xs border border-slate-200 rounded-md bg-slate-50 text-slate-700"
            >
              <option value="all">All Audiences</option>
              <option value="Students">Students Only</option>
              <option value="Teachers">Teachers Only</option>
              <option value="Parents">Parents Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Notices Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredNotices.map((notice) => (
          <div
            key={notice.id}
            className={`bg-white border rounded-xl p-5 flex flex-col justify-between transition-all shadow-xs ${
              notice.isPinned
                ? 'border-indigo-200 bg-indigo-50/20 ring-1 ring-indigo-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2 flex-wrap">
                  {notice.isPinned && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                      <Pin className="w-3 h-3 fill-indigo-600" />
                      Pinned Bulletin
                    </span>
                  )}
                  <span
                    className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                      notice.priority === 'Urgent'
                        ? 'bg-rose-100 text-rose-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {notice.category}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Audience: {notice.targetAudience}
                  </span>
                </div>

                {(currentRole === 'Admin' || currentRole === 'Teacher') && <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => togglePinNotice(notice.id)}
                    className={`p-1.5 rounded transition-colors ${
                      notice.isPinned
                        ? 'text-indigo-600 hover:bg-indigo-100'
                        : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                    title={notice.isPinned ? 'Unpin notice' : 'Pin notice to top'}
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEdit(notice)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded"
                    title="Edit notice"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setNoticeToDelete(notice)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded"
                    title="Delete notice"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>}
              </div>

              {/* Title & Content */}
              <h3 className="text-sm font-bold text-slate-900 tracking-tight mb-2">
                {notice.title}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">
                {notice.content}
              </p>
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-mono">
              <span>{notice.publishedDate}</span>
              <span>Issued by {notice.authorName}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add / Edit Notice Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={noticeToEdit ? 'Edit Bulletin Notice' : 'Publish Academy Notice'}
        subtitle="School-wide official communication and announcements"
        maxWidth="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notice Title *
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Annual Sports Meet 2026 Registration"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value as any })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="Academic">Academic</option>
                <option value="Event">Event</option>
                <option value="Holiday">Holiday</option>
                <option value="Administrative">Administrative</option>
                <option value="Sports">Sports</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Priority
              </label>
              <select
                value={formData.priority}
                onChange={(e) =>
                  setFormData({ ...formData, priority: e.target.value as NoticePriority })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Urgent">Urgent</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Target Audience
              </label>
              <select
                value={formData.targetAudience}
                onChange={(e) =>
                  setFormData({ ...formData, targetAudience: e.target.value as NoticeAudience })
                }
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              >
                <option value="All">All Academy</option>
                <option value="Students">Students Only</option>
                <option value="Teachers">Faculty / Staff</option>
                <option value="Parents">Parents Only</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Author / Office
              </label>
              <input
                type="text"
                value={formData.authorName}
                onChange={(e) => setFormData({ ...formData, authorName: e.target.value })}
                placeholder="e.g. Office of the Principal"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Notice Content *
            </label>
            <textarea
              rows={4}
              required
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Write the full announcement details, deadlines, and instructions..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="pinNoticeCheckbox"
              checked={formData.isPinned}
              onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="pinNoticeCheckbox" className="text-xs font-medium text-slate-700">
              Pin to top of notice board
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
            >
              {isSaving ? 'Saving...' : noticeToEdit ? 'Save Changes' : 'Publish Notice'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Notice Dialog */}
      <ConfirmDialog
        isOpen={(currentRole === 'Admin' || currentRole === 'Teacher') && !!noticeToDelete}
        onClose={() => setNoticeToDelete(null)}
        onConfirm={() => {
          if (noticeToDelete) {
            deleteNotice(noticeToDelete.id);
            setNoticeToDelete(null);
          }
        }}
        title="Remove Notice"
        message={`Are you sure you want to remove "${noticeToDelete?.title}" from the bulletin?`}
        confirmLabel="Remove Notice"
        isDestructive={true}
      />
    </div>
  );
};
