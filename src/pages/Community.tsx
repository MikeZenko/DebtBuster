import React from 'react';
import { Users, MessageCircle, Trophy, Heart, Star, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { CommunitySection } from '../components/CommunitySection';

const SuccessStory = ({ name, amount, timeframe, method, story }: {
  name: string;
  amount: string;
  timeframe: string;
  method: string;
  story: string;
}) => (
  <Card className="border-green-200 bg-green-50/50">
    <CardHeader>
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarFallback>{name.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{name}</CardTitle>
            <Badge variant="secondary">Success Story</Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
            <span>Paid off {amount}</span>
            <span>•</span>
            <span>{timeframe}</span>
            <span>•</span>
            <span>{method} Method</span>
          </div>
        </div>
        <Trophy className="h-5 w-5 text-yellow-500" />
      </div>
    </CardHeader>
    <CardContent>
      <p className="text-sm">{story}</p>
      <div className="flex items-center gap-4 mt-3">
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <Heart className="h-4 w-4 mr-1" />
          124
        </Button>
        <Button variant="ghost" size="sm" className="h-8 px-2">
          <MessageCircle className="h-4 w-4 mr-1" />
          Reply
        </Button>
      </div>
    </CardContent>
  </Card>
);

const ForumPost = ({ author, title, preview, replies, likes, category, timeAgo }: {
  author: string;
  title: string;
  preview: string;
  replies: number;
  likes: number;
  category: string;
  timeAgo: string;
}) => (
  <Card className="hover:shadow-md transition-shadow cursor-pointer">
    <CardContent className="p-4">
      <div className="flex items-start gap-3">
        <Avatar>
          <AvatarFallback>{author.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="text-xs">{category}</Badge>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
          </div>
          <h3 className="font-semibold text-sm mb-1 truncate">{title}</h3>
          <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{preview}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>by {author}</span>
            <div className="flex items-center gap-1">
              <MessageCircle className="h-3 w-3" />
              {replies}
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-3 w-3" />
              {likes}
            </div>
          </div>
        </div>
      </div>
    </CardContent>
  </Card>
);

export function Community() {
  const successStories = [
    {
      name: "Sarah M.",
      amount: "$45,000",
      timeframe: "3 years",
      method: "Avalanche",
      story: "Started with 6 credit cards and 2 loans. Used the avalanche method and increased my income with freelance work. The key was automating everything and celebrating small wins along the way!"
    },
    {
      name: "Mike D.",
      amount: "$28,500",
      timeframe: "2.5 years",
      method: "Snowball",
      story: "The snowball method kept me motivated when I wanted to give up. Paying off my smallest debts first gave me the momentum I needed to tackle the bigger ones. Worth every sacrifice!"
    },
    {
      name: "Jennifer K.",
      amount: "$67,200",
      timeframe: "4 years",
      method: "Hybrid",
      story: "Combined both methods - started with snowball for motivation, then switched to avalanche for the math. Also used balance transfers strategically to reduce interest rates."
    },
  ];

  const forumPosts = [
    {
      author: "DebtFreeByForty",
      title: "Should I pay off student loans or invest?",
      preview: "I have $15k in student loans at 4.5% interest. Should I focus on paying these off or start investing in my 401k? My employer matches 50%...",
      replies: 23,
      likes: 15,
      category: "Strategy",
      timeAgo: "2 hours ago"
    },
    {
      author: "BudgetingBeginner",
      title: "How to handle variable income with debt payoff?",
      preview: "I'm a freelancer with irregular income. Some months I make $3k, others $8k. How do I create a consistent debt payoff plan?",
      replies: 18,
      likes: 22,
      category: "Planning",
      timeAgo: "4 hours ago"
    },
    {
      author: "MillennialMoney",
      title: "Balance transfer vs personal loan for credit card debt?",
      preview: "Have $12k spread across 3 credit cards (18-24% APR). Considering a balance transfer card or personal loan at 8%. What are the pros and cons?",
      replies: 31,
      likes: 28,
      category: "Refinancing",
      timeAgo: "6 hours ago"
    },
  ];

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="text-center space-y-3 mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
          <Users className="h-8 w-8 text-indigo-600" />
        </div>
        <h1 className="text-4xl font-bold">Community</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Connect with others on their debt-free journey. Share progress, get support, and celebrate wins together.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Badge variant="outline">Success Stories</Badge>
          <Badge variant="outline">Expert Advice</Badge>
          <Badge variant="outline">Peer Support</Badge>
        </div>
      </div>

      {/* Community Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">2,847</div>
            <div className="text-sm text-muted-foreground">Active Members</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">$2.1M</div>
            <div className="text-sm text-muted-foreground">Debt Paid Off</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">1,205</div>
            <div className="text-sm text-muted-foreground">Success Stories</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold">4.8</div>
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-1">
                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                Community Rating
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Success Stories */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Recent Success Stories</h2>
          <Button variant="outline">Share Your Story</Button>
        </div>
        <div className="space-y-6">
          {successStories.map((story, index) => (
            <SuccessStory key={index} {...story} />
          ))}
        </div>
      </div>

      {/* Main Community Component */}
      <CommunitySection />

      {/* Popular Discussions */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Popular Discussions</h2>
          <Button variant="outline">View All Topics</Button>
        </div>
        <div className="space-y-4">
          {forumPosts.map((post, index) => (
            <ForumPost key={index} {...post} />
          ))}
        </div>
      </div>

      {/* Upcoming Events */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Upcoming Community Events
          </CardTitle>
          <CardDescription>Join live sessions and workshops</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="text-center min-w-0">
                <div className="font-semibold">MAR</div>
                <div className="text-2xl font-bold">15</div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Debt Avalanche Workshop</h3>
                <p className="text-sm text-muted-foreground">Learn advanced strategies for high-interest debt elimination</p>
                <div className="text-xs text-muted-foreground mt-1">7:00 PM EST • Virtual Event</div>
              </div>
              <Button size="sm">Register</Button>
            </div>
            <div className="flex items-center gap-4 p-3 border rounded-lg">
              <div className="text-center min-w-0">
                <div className="font-semibold">MAR</div>
                <div className="text-2xl font-bold">22</div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">Q&A with Financial Expert</h3>
                <p className="text-sm text-muted-foreground">Ask questions about refinancing, consolidation, and more</p>
                <div className="text-xs text-muted-foreground mt-1">8:00 PM EST • Virtual Event</div>
              </div>
              <Button size="sm">Register</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Community Guidelines */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle>Community Guidelines</CardTitle>
          <CardDescription>Help us maintain a supportive and helpful environment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6 text-sm">
            <div>
              <h4 className="font-semibold mb-2">Be Kind & Supportive</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Everyone's financial situation is different</li>
                <li>• Celebrate others' wins, no matter how small</li>
                <li>• Offer encouragement during setbacks</li>
                <li>• No judgment or financial shaming</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Share Responsibly</h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Share what worked for your situation</li>
                <li>• Avoid giving specific financial advice</li>
                <li>• No spam, affiliate links, or promotions</li>
                <li>• Protect your personal information</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}








