import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, 
  Edit, 
  Eye, 
  EyeOff, 
  Trash2, 
  Save, 
  Send, 
  Archive, 
  Copy,
  Move,
  Settings,
  Image,
  Link,
  Type,
  Layout
} from 'lucide-react';
import { toast } from 'sonner';

interface LandingSection {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  layoutVariant: string;
  theme?: any;
  orderIndex: number;
  visible: boolean;
  status: 'draft' | 'published' | 'archived';
  version: number;
  draftJson?: any;
  publishedJson?: any;
  updatedBy?: string;
  updatedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
  cards?: LandingCard[];
}

interface LandingCard {
  id: string;
  sectionId: string;
  orderIndex: number;
  title?: string;
  body?: string;
  mediaUrl?: string;
  icon?: string;
  ctaLabel?: string;
  ctaHref?: string;
  visible: boolean;
  status: 'draft' | 'published' | 'archived';
  version: number;
  draftJson?: any;
  publishedJson?: any;
  updatedBy?: string;
  updatedAt?: string;
  publishedBy?: string;
  publishedAt?: string;
}

interface CMSEditorProps {
  section: LandingSection;
  onUpdate: (section: LandingSection) => void;
  onSave: (section: LandingSection) => void;
  onPublish: (section: LandingSection) => void;
}

const SectionEditor: React.FC<CMSEditorProps> = ({ section, onUpdate, onSave, onPublish }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedSection, setEditedSection] = useState(section);

  const handleSave = () => {
    onSave(editedSection);
    setIsEditing(false);
    toast.success('Section saved successfully');
  };

  const handlePublish = () => {
    onPublish(editedSection);
    toast.success('Section published successfully');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Layout className="h-5 w-5" />
            Section Editor
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save Draft
                </Button>
                <Button onClick={handlePublish} variant="default" size="sm">
                  <Send className="h-4 w-4 mr-2" />
                  Publish
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editedSection.title}
                onChange={(e) => setEditedSection({ ...editedSection, title: e.target.value })}
                placeholder="Section title"
                maxLength={120}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Subtitle</label>
              <Input
                value={editedSection.subtitle || ''}
                onChange={(e) => setEditedSection({ ...editedSection, subtitle: e.target.value })}
                placeholder="Section subtitle"
                maxLength={180}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Layout Variant</label>
              <select
                value={editedSection.layoutVariant}
                onChange={(e) => setEditedSection({ ...editedSection, layoutVariant: e.target.value })}
                className="w-full p-2 border rounded-md"
              >
                <option value="hero">Hero</option>
                <option value="grid">Grid</option>
                <option value="pricing">Pricing</option>
                <option value="logos">Logos</option>
                <option value="cta">CTA</option>
                <option value="custom">Custom</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="visible"
                checked={editedSection.visible}
                onChange={(e) => setEditedSection({ ...editedSection, visible: e.target.checked })}
              />
              <label htmlFor="visible" className="text-sm font-medium">
                Visible
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            <h3 className="text-lg font-semibold">{section.title}</h3>
            {section.subtitle && <p className="text-gray-600">{section.subtitle}</p>}
            <div className="flex items-center gap-2">
              <Badge variant={section.status === 'published' ? 'default' : 'secondary'}>
                {section.status}
              </Badge>
              <Badge variant={section.visible ? 'default' : 'destructive'}>
                {section.visible ? 'Visible' : 'Hidden'}
              </Badge>
              <span className="text-sm text-gray-500">v{section.version}</span>
            </div>
            {section.updatedAt && (
              <p className="text-xs text-gray-500">
                Last updated: {new Date(section.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CardEditor: React.FC<{
  card: LandingCard;
  onUpdate: (card: LandingCard) => void;
  onSave: (card: LandingCard) => void;
  onDelete: (cardId: string) => void;
}> = ({ card, onUpdate, onSave, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState(card);

  const handleSave = () => {
    onSave(editedCard);
    setIsEditing(false);
    toast.success('Card saved successfully');
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Type className="h-4 w-4" />
            Card Editor
          </CardTitle>
          <div className="flex gap-2">
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)} variant="outline" size="sm">
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : (
              <>
                <Button onClick={handleSave} size="sm">
                  <Save className="h-4 w-4 mr-2" />
                  Save
                </Button>
                <Button onClick={() => setIsEditing(false)} variant="outline" size="sm">
                  Cancel
                </Button>
              </>
            )}
            <Button 
              onClick={() => onDelete(card.id)} 
              variant="destructive" 
              size="sm"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editedCard.title || ''}
                onChange={(e) => setEditedCard({ ...editedCard, title: e.target.value })}
                placeholder="Card title"
                maxLength={120}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Body</label>
              <Textarea
                value={editedCard.body || ''}
                onChange={(e) => setEditedCard({ ...editedCard, body: e.target.value })}
                placeholder="Card content"
                maxLength={10000}
                rows={4}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Media URL</label>
              <Input
                value={editedCard.mediaUrl || ''}
                onChange={(e) => setEditedCard({ ...editedCard, mediaUrl: e.target.value })}
                placeholder="https://example.com/image.jpg"
              />
            </div>
            <div>
              <label className="text-sm font-medium">CTA Label</label>
              <Input
                value={editedCard.ctaLabel || ''}
                onChange={(e) => setEditedCard({ ...editedCard, ctaLabel: e.target.value })}
                placeholder="Call to action text"
                maxLength={60}
              />
            </div>
            <div>
              <label className="text-sm font-medium">CTA Link</label>
              <Input
                value={editedCard.ctaHref || ''}
                onChange={(e) => setEditedCard({ ...editedCard, ctaHref: e.target.value })}
                placeholder="https://example.com"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="card-visible"
                checked={editedCard.visible}
                onChange={(e) => setEditedCard({ ...editedCard, visible: e.target.checked })}
              />
              <label htmlFor="card-visible" className="text-sm font-medium">
                Visible
              </label>
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {card.title && <h4 className="font-medium">{card.title}</h4>}
            {card.body && <p className="text-sm text-gray-600">{card.body}</p>}
            {card.mediaUrl && (
              <div className="flex items-center gap-2 text-sm text-blue-600">
                <Image className="h-4 w-4" />
                <span>Media attached</span>
              </div>
            )}
            {card.ctaLabel && card.ctaHref && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <Link className="h-4 w-4" />
                <span>{card.ctaLabel}</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <Badge variant={card.status === 'published' ? 'default' : 'secondary'}>
                {card.status}
              </Badge>
              <Badge variant={card.visible ? 'default' : 'destructive'}>
                {card.visible ? 'Visible' : 'Hidden'}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const CMSPage: React.FC = () => {
  const [sections, setSections] = useState<LandingSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<LandingSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'draft' | 'published'>('draft');

  useEffect(() => {
    loadSections();
  }, [viewMode]);

  const loadSections = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/cms/landing/sections?status=${viewMode}`);
      if (response.ok) {
        const data = await response.json();
        setSections(data.data || []);
        if (data.data && data.data.length > 0 && !selectedSection) {
          setSelectedSection(data.data[0]);
        }
      } else {
        toast.error('Failed to load sections');
      }
    } catch (error) {
      console.error('Error loading sections:', error);
      toast.error('Failed to load sections');
    } finally {
      setLoading(false);
    }
  };

  const handleSectionUpdate = async (section: LandingSection) => {
    try {
      const response = await fetch(`/api/cms/landing/sections/${section.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(section),
      });
      
      if (response.ok) {
        const updatedSection = await response.json();
        setSections(prev => prev.map(s => s.id === section.id ? updatedSection : s));
        if (selectedSection?.id === section.id) {
          setSelectedSection(updatedSection);
        }
      } else {
        toast.error('Failed to update section');
      }
    } catch (error) {
      console.error('Error updating section:', error);
      toast.error('Failed to update section');
    }
  };

  const handleSectionSave = async (section: LandingSection) => {
    await handleSectionUpdate(section);
  };

  const handleSectionPublish = async (section: LandingSection) => {
    try {
      const response = await fetch(`/api/cms/landing/sections/${section.id}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publishCards: true }),
      });
      
      if (response.ok) {
        const publishedSection = await response.json();
        setSections(prev => prev.map(s => s.id === section.id ? publishedSection : s));
        if (selectedSection?.id === section.id) {
          setSelectedSection(publishedSection);
        }
        toast.success('Section published successfully');
      } else {
        toast.error('Failed to publish section');
      }
    } catch (error) {
      console.error('Error publishing section:', error);
      toast.error('Failed to publish section');
    }
  };

  const handleCardUpdate = async (card: LandingCard) => {
    try {
      const response = await fetch(`/api/cms/landing/cards/${card.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(card),
      });
      
      if (response.ok) {
        const updatedCard = await response.json();
        setSections(prev => prev.map(section => {
          if (section.id === card.sectionId) {
            return {
              ...section,
              cards: section.cards?.map(c => c.id === card.id ? updatedCard : c) || []
            };
          }
          return section;
        }));
        
        if (selectedSection?.id === card.sectionId) {
          setSelectedSection(prev => ({
            ...prev!,
            cards: prev!.cards?.map(c => c.id === card.id ? updatedCard : c) || []
          }));
        }
      } else {
        toast.error('Failed to update card');
      }
    } catch (error) {
      console.error('Error updating card:', error);
      toast.error('Failed to update card');
    }
  };

  const handleCardSave = async (card: LandingCard) => {
    await handleCardUpdate(card);
  };

  const handleCardDelete = async (cardId: string) => {
    try {
      const response = await fetch(`/api/cms/landing/cards/${cardId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setSections(prev => prev.map(section => ({
          ...section,
          cards: section.cards?.filter(c => c.id !== cardId) || []
        })));
        
        if (selectedSection) {
          setSelectedSection(prev => ({
            ...prev!,
            cards: prev!.cards?.filter(c => c.id !== cardId) || []
          }));
        }
        toast.success('Card deleted successfully');
      } else {
        toast.error('Failed to delete card');
      }
    } catch (error) {
      console.error('Error deleting card:', error);
      toast.error('Failed to delete card');
    }
  };

  const handleAddCard = async () => {
    if (!selectedSection) return;
    
    try {
      const response = await fetch('/api/cms/landing/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sectionId: selectedSection.id }),
      });
      
      if (response.ok) {
        const newCard = await response.json();
        setSections(prev => prev.map(section => {
          if (section.id === selectedSection.id) {
            return {
              ...section,
              cards: [...(section.cards || []), newCard]
            };
          }
          return section;
        }));
        
        setSelectedSection(prev => ({
          ...prev!,
          cards: [...(prev!.cards || []), newCard]
        }));
        toast.success('Card added successfully');
      } else {
        toast.error('Failed to add card');
      }
    } catch (error) {
      console.error('Error adding card:', error);
      toast.error('Failed to add card');
    }
  };

  const handleDragEnd = async (result: any) => {
    if (!result.destination) return;

    const { source, destination, draggableId } = result;
    
    if (source.droppableId === 'sections') {
      // Reorder sections
      const newSections = Array.from(sections);
      const [reorderedSection] = newSections.splice(source.index, 1);
      newSections.splice(destination.index, 0, reorderedSection);
      
      setSections(newSections);
      
      // Update order indices
      const orders = newSections.map((section, index) => ({
        id: section.id,
        orderIndex: index
      }));
      
      try {
        await fetch('/api/cms/landing/sections/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orders }),
        });
      } catch (error) {
        console.error('Error reordering sections:', error);
        toast.error('Failed to reorder sections');
      }
    } else if (source.droppableId === 'cards' && selectedSection) {
      // Reorder cards
      const newCards = Array.from(selectedSection.cards || []);
      const [reorderedCard] = newCards.splice(source.index, 1);
      newCards.splice(destination.index, 0, reorderedCard);
      
      setSelectedSection(prev => ({
        ...prev!,
        cards: newCards
      }));
      
      // Update order indices
      const orders = newCards.map((card, index) => ({
        id: card.id,
        orderIndex: index
      }));
      
      try {
        await fetch('/api/cms/landing/cards/reorder', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            sectionId: selectedSection.id,
            orders 
          }),
        });
      } catch (error) {
        console.error('Error reordering cards:', error);
        toast.error('Failed to reorder cards');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading CMS...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Content Management System</h1>
          <p className="text-gray-600">Manage your landing page content</p>
        </div>

        <Tabs value={viewMode} onValueChange={(value) => setViewMode(value as 'draft' | 'published')}>
          <TabsList>
            <TabsTrigger value="draft">Draft</TabsTrigger>
            <TabsTrigger value="published">Published</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Left: Section List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Sections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="sections">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {sections.map((section, index) => (
                          <Draggable key={section.id} draggableId={section.id} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                className={`p-3 border rounded-lg cursor-move ${
                                  selectedSection?.id === section.id ? 'bg-blue-50 border-blue-200' : 'bg-white'
                                } ${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                onClick={() => setSelectedSection(section)}
                              >
                                <div className="flex items-center justify-between">
                                  <div>
                                    <h4 className="font-medium">{section.title}</h4>
                                    <p className="text-sm text-gray-500">{section.slug}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <Badge variant={section.status === 'published' ? 'default' : 'secondary'}>
                                      {section.status}
                                    </Badge>
                                    <Move className="h-4 w-4 text-gray-400" />
                                  </div>
                                </div>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </CardContent>
            </Card>
          </div>

          {/* Center: Section Editor */}
          <div className="lg:col-span-1">
            {selectedSection ? (
              <SectionEditor
                section={selectedSection}
                onUpdate={handleSectionUpdate}
                onSave={handleSectionSave}
                onPublish={handleSectionPublish}
              />
            ) : (
              <Card>
                <CardContent className="p-6 text-center">
                  <p className="text-gray-500">Select a section to edit</p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right: Card List */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Type className="h-5 w-5" />
                    Cards
                  </CardTitle>
                  <Button onClick={handleAddCard} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Card
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {selectedSection ? (
                  <DragDropContext onDragEnd={handleDragEnd}>
                    <Droppable droppableId="cards">
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                          {selectedSection.cards?.map((card, index) => (
                            <Draggable key={card.id} draggableId={card.id} index={index}>
                              {(provided, snapshot) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  className={`p-3 border rounded-lg cursor-move ${
                                    snapshot.isDragging ? 'shadow-lg' : 'bg-white'
                                  }`}
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <h5 className="font-medium">{card.title || 'Untitled Card'}</h5>
                                      <p className="text-sm text-gray-500">
                                        {card.body ? card.body.substring(0, 50) + '...' : 'No content'}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Badge variant={card.status === 'published' ? 'default' : 'secondary'}>
                                        {card.status}
                                      </Badge>
                                      <Move className="h-4 w-4 text-gray-400" />
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                ) : (
                  <p className="text-gray-500 text-center">Select a section to view cards</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Card Editor Modal */}
        {selectedSection && selectedSection.cards && selectedSection.cards.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-4">Card Editor</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {selectedSection.cards.map((card) => (
                <CardEditor
                  key={card.id}
                  card={card}
                  onUpdate={handleCardUpdate}
                  onSave={handleCardSave}
                  onDelete={handleCardDelete}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CMSPage;
