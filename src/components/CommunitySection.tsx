import React, { useState } from 'react';
import { Users, LinkIcon, Video } from 'lucide-react';
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "./ui/card";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Separator } from "./ui/separator";

export function CommunitySection() {
  const [newTopic, setNewTopic] = useState('');

  const mockThreads = [
    {
      id: 1,
      author: "DebtFreeInProgress",
      title: "Finally paid off my highest APR card!",
      content: "Used the avalanche method and paid off $3,200 at 26.9% APR. Next target: auto loan! 🎉",
      timeAgo: "2 hours ago"
    },
    {
      id: 2,
      author: "FirstTimeHomebuyer",
      title: "Question about comparing mortgage offers",
      content: "I have three offers with different APRs and closing costs. How do I compare them effectively?",
      timeAgo: "5 hours ago"
    },
    {
      id: 3,
      author: "SnowballSuccess",
      title: "Month 6 progress update",
      content: "Snowball method working great! Paid off two small debts and feeling so motivated to continue.",
      timeAgo: "1 day ago"
    }
  ];

  const handlePostTopic = () => {
    if (newTopic.trim()) {
      // In a real app, this would post to a backend
      console.log('New topic:', newTopic);
      setNewTopic('');
      alert('Topic posted! (In the real app, this would save to a database)');
    }
  };

  return (
    <section id="community" className="py-16 md:py-24">
      <div className="container mx-auto px-4">
        <div className="mb-10">
          <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Peer support</h2>
          <p className="text-muted-foreground mt-2 max-w-2xl">
            Share progress, wins, and questions with others on the debt-free journey.
          </p>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6 items-start">
          <Card className="rounded-2xl lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" /> 
                Community Discussions
              </CardTitle>
              <CardDescription>Share experiences and get support from others.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* New Topic Form */}
              <div className="grid gap-2">
                <Label htmlFor="topic">Start a discussion</Label>
                <Textarea 
                  id="topic"
                  placeholder="Share your progress, ask for advice, or celebrate a win..."
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                />
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    Be supportive and respectful. No financial spam or affiliate links.
                  </div>
                  <Button onClick={handlePostTopic}>Post Discussion</Button>
                </div>
              </div>
              
              <Separator />
              
              {/* Recent Discussions */}
              <div className="space-y-4">
                {mockThreads.map((thread) => (
                  <div key={thread.id} className="rounded-xl border p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="font-medium text-sm">{thread.author}</div>
                      <div className="text-xs text-muted-foreground">{thread.timeAgo}</div>
                    </div>
                    <div className="font-medium mb-1">{thread.title}</div>
                    <div className="text-sm text-muted-foreground">{thread.content}</div>
                    <div className="mt-2 flex gap-2">
                      <Button variant="ghost" size="sm">Reply</Button>
                      <Button variant="ghost" size="sm">👍 5</Button>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="text-center py-4">
                <Button variant="outline">Load More Discussions</Button>
              </div>
            </CardContent>
          </Card>
          
          {/* Quick Links Sidebar */}
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Quick Links</CardTitle>
              <CardDescription>Helpful resources & tools.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="secondary" className="w-full flex gap-2">
                <LinkIcon className="h-4 w-4" /> 
                Lender Checklist PDF
              </Button>
              <Button variant="secondary" className="w-full flex gap-2">
                <LinkIcon className="h-4 w-4" /> 
                Debt Avalanche Calculator
              </Button>
              <Button variant="secondary" className="w-full flex gap-2">
                <Video className="h-4 w-4" /> 
                How-to Video Guides
              </Button>
              <Button variant="secondary" className="w-full flex gap-2">
                <LinkIcon className="h-4 w-4" /> 
                Consumer Protection Resources
              </Button>
              
              <Separator className="my-4" />
              
              <div className="text-sm space-y-2">
                <div className="font-medium">Success Stories</div>
                <div className="text-muted-foreground">
                  "Paid off $45k in 3 years using the avalanche method!" - Sarah M.
                </div>
                <div className="text-muted-foreground">
                  "The loan comparison tool saved me $2,800 in interest." - Mike D.
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}
