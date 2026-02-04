0:00
Skills are folders of instructions
0:01
that package repeated workflows,
0:03
specialized knowledge, or new capabilities for your agent.
0:06
If you find yourself typing the same prompt across conversations,
0:10
you should consider transforming that into a skill.
0:13
Let's explore how to do that using Claude AI.
0:16
So before we talk a little bit more about skills
0:18
and dive into what a skill looks like and how it works,
0:21
let's walk through a scenario to showcase why skills are so useful.
0:26
Right here, I've got some campaign data in a CSV
0:28
that I'd like to analyze the performance of.
0:31
So just to show you what
0:33
this looks like, I've got a date,
0:34
a campaign name, impressions, clicks, conversions.
0:37
You can imagine here that we're
0:39
going to take in some marketing data
0:41
use Claude to analyze this information.
0:43
So in my first prompt, I'm attaching this data,
0:46
explaining what the input data looks like,
0:48
asking to check for quality, funnel analysis,
0:51
and some useful metrics around what I expect
0:53
for click-through rates and conversion rates.
0:56
At the bottom, I've got an output format
0:58
that I'm requesting for this particular piece of data.
1:01
Now you can imagine it would be valuable
1:03
to not have to include this prompt
1:05
every time and to have that packaged up.
1:08
As we take a look at
1:09
what we're seeing in our campaign data,
1:10
Claude is going to read this CSV.
1:13
It's then going to perform the Data Quality Check and Funnel Analysis
1:17
and give us back our campaign performance analysis.
1:20
Here it's going to show the Total Records,
1:23
any Missing Data, and any Anomalies in the data that exist.
1:27
If we take a look a little
1:29
bit further, we'll see our Funnel Analysis
1:31
versus the benchmark data that we were looking for before.
1:34
We can see here, some things that are working better,
1:37
some things that are not working as well. We're getting a
1:39
lot of useful data back that we can take action around,
1:41
change our marketing campaigns and move forward.
1:44
We've got a nice interpretation of what Claude is telling us,
1:47
what's working, what's not working.
1:49
And now we're going to go ahead
1:51
and ask for additional computations of certain
1:53
efficiency metrics for marketing.
1:56
These include return on our ad spend,
1:58
cost per acquisition, and net profit and so on.
2:01
We're also going to ask for
2:03
an output format in a certain fashion.
2:06
We'll see the results from this efficiency analysis,
2:08
we'll see what's working, again, what's not working and some interpretations.
2:12
we'll see our portfolio performance and our total net profit.
2:15
Looks like we're making money here, but there's
2:17
still much more that I'm sure we can do.
2:19
The next step that we're going to do here is to
2:22
take in an additional piece of data, our budget reallocation rules.
2:25
The idea here is that we
2:27
have extra money to play around with
2:28
and think about allocating towards other marketing channels.
2:32
You can imagine this file has quite a bit of data
2:35
around the rules for allocating,
2:37
what we're trying to figure out and how best
2:40
to decide where to increase our budget.
2:42
This could also lead to maintaining a budget or decreasing a budget
2:45
based on this framework that we have here.
2:48
Again, this is a lot of data
2:49
that is specific to our particular use case.
2:52
Claude knows how to handle particular decisions
2:54
and analyze marketing metrics,
2:56
but here we're specifying exactly the
2:58
way that we want to do things.
3:00
This requires me bringing in external documentation,
3:03
finding the right people, and even if
3:05
I'm not the most knowledgeable about this,
3:07
hoping that I get it right.
3:09
We're going to go ahead and see these allocation rules, our recommendations.
3:12
We can see what's passing, what's not passing,
3:15
and a proposed reallocation here.
3:17
Freeing up some budget,
3:19
analyzing what's working and where to allocate additional budget towards.
3:23
What we've seen here is a step-by-step process
3:25
that requires us as the user to put in the necessary documentation
3:29
and have the necessary pre-existing knowledge.
3:33
Not only that, but everything that I'm putting in here
3:36
is immediately getting added to the context window.
3:38
What happens if I want to ask something different?
3:41
What happens if I want to have a different kind of conversation?
3:43
This information here is not always
3:45
necessary for everything I'm going to do.
3:48
What we're going to take a
3:49
look at here is how we can
3:50
take this information and package it into a skill.
3:54
a standalone asset, a folder really,
3:56
that contains instructions for how to go about performing the campaign analysis
4:01
while also being intentional
4:03
about what information goes into the context window
4:06
and what information doesn't.
4:08
As we've seen, this is a weekly campaign performance analysis.
4:12
So this isn't something that I want to
4:14
have to repeat on my own every single week
4:17
with this particular prompt by copying and pasting.
4:20
This is going to be much nicer
4:22
to have pre-packaged that I can use myself,
4:24
share with members of the team, and edit as necessary.
4:27
So with that, let's take a
4:29
look at what a SKILL.md file is.
4:31
This file needs to be named SKILL.md in markdown format.
4:35
And this is going to be the underlying set
4:37
of instructions to perform the task that we saw.
4:40
In this Markdown file, I have very similar
4:43
information to what I included in the previous prompt.
4:46
I have my input requirements, a data quality check,
4:50
funnel analysis with the metrics that we were working at before,
4:53
and historical benchmarks.
4:55
I have that same Efficiency Analysis
4:57
as well as the Output Format that I expect.
5:00
Finally, I have a note here on Budget Reallocation
5:03
that references a different file
5:06
only when the user asks about Budget Reallocation.
5:09
So we talked a little bit about how
5:11
this can be much more efficient with context.
5:13
This is one example where I'm only
5:15
going to be reading and using this file
5:17
if a user asks about that particular piece of information.
5:22
In order to get this skill to work as expected,
5:25
there's one more piece of data
5:26
that I need to add to the beginning here.
5:28
This data is in a data format called
5:30
YAML, and here's what it looks like.
5:33
Every skill that you make across the entire standard
5:37
requires a name as well as a description.
5:40
The name of the skill is going to be important for referencing
5:43
when to use it and in the UI
5:45
that we're working with if it's being used.
5:47
And the description is important
5:49
so that the model that we're working with can understand
5:51
when to use this particular skill.
5:54
When you make a skill, the name and description are required.
5:58
So we've got our SKILL.md file,
6:00
and the second file I want to show you is just this
6:02
budget_reallocation_rules.md file,
6:05
which is very similar to the other prompt that we saw.
6:08
When you make a skill, your skill can reference other files
6:12
as long as they're all in the same parent folder.
6:15
These budget reallocation rules are exactly
6:18
what I put in that previous conversation with Claude AI.
6:21
So what we're doing here is we're moving away
6:24
from putting in instructions directly in our conversation,
6:27
and instead putting it into a folder.
6:30
Now that I've got this SKILL file,
6:32
as well as any external files,
6:35
What I'm going to do here is make a new folder.
6:38
And I'll name that folder the name of the skill,
6:41
analyzing-marketing-campaign.
6:43
There are some high-level rules around naming skills.
6:46
Stick with lowercase letters, use dashes between words,
6:50
and don't use reserved keywords like Claude or Anthropic.
6:54
Now that I've created this folder for the skill that I'm making,
6:58
I'm going to go ahead and make another folder called references.
7:02
When we look at the open standard for skills,
7:05
we're going to see that this actually is a specific name
7:08
that we use when there are external references
7:11
that the skill uses. And inside of our SKILL.md,
7:14
we linked to references/budget_reallocation_rules.
7:18
So I'll go ahead and put that file in this folder.
7:22
I'll put the folder inside of our marketing campaign.
7:25
And then I'll put the SKILL.md
7:28
at the top level of this folder.
7:30
If we take a quick look at what's inside,
7:32
we should see our SKILL.md as well as our references folder
7:36
that contains that additional budget allocation file.
7:39
Now I'm going to go ahead and
7:41
create a zip file from this folder
7:44
and I'm going to go ahead and upload that to Claude AI.
7:47
Once I upload that skill,
7:49
I should be able to start using it in future conversations.
7:53
I'm going to head over to my Settings right over here.
7:56
And I'm going to go to Capabilities.
7:59
As I navigate to the bottom of Capabilities,
8:02
we're going to see this section on Skills.
8:04
There are some example ones that
8:05
we'll talk a little bit about later.
8:07
But right now, I want to add my
8:09
own. So I'm going to go ahead and add,
8:11
and I'm going to upload the skill in a zip file
8:14
that I created. I'm going to go
8:15
ahead and drag and drop that zip file
8:17
and give that a second to upload.
8:20
Once that's done, we can see the name
8:22
of our skill as well as that description.
8:24
Now that we've uploaded our skill, let's go see this in action.
8:28
I'm going to start with a new chat.
8:30
I'm going to go ahead and ask Claude
8:32
a similar prompt to what I had before.
8:34
And I'm going to go ahead now and attach the same CSV
8:36
that I was working with before.
8:39
If this works as expected,
8:41
we should start to see Claude pick up the skill
8:43
for our weekly marketing campaign.
8:46
Claude should then perform the tasks required in that skill
8:49
and the need for us to
8:50
have all that prompt back and forth
8:52
is no longer there.
8:54
So let's go ahead and see what Claude can do here.
8:56
We'll see here it's going to read this skill file
8:58
to ensure it's following the right instructions.
9:02
The name of our skill as well as the description
9:04
is what is allowing Claude to pick this up.
9:07
Since we're asking about reallocating the budget,
9:10
it's going to go ahead and read that additional file
9:13
that we uploaded to our skill.
9:15
We'll then go ahead and analyze the data.
9:17
If you want to see the code
9:19
that Claude is running and executing here,
9:21
we can always open this up and take
9:23
a look at what's happening behind the scenes.
9:29
What we're going to see here is
9:31
something very similar to what we saw before.
9:33
we're going to analyze channels that may
9:35
have additional challenges, in this case TikTok.
9:37
We may see things that are working as well as recommended reallocations.
9:41
But in this case, we didn't
9:43
have to add all the prompting ourselves.
9:45
This skill can be shared across many different platforms.
9:48
And since skills are an open standard, this is supported
9:51
in other coding environments like Codex, Gemini CLI, and much more.
9:56
So not only have we created a way to take this data
9:58
and package it up into a centralized place,
10:01
we're being more efficient with the context window
10:04
and the portability here is extremely valuable.
10:06
Now, let's go ahead and create a report
10:09
with the data that we found.
10:11
We're going to go ahead and create an Excel report
10:13
with the following pieces of information
10:16
as well as a color coding that we're recommending.
10:19
Under the hood, the ability to create spreadsheets
10:21
and execute necessary code to do so,
10:24
actually lives in a skill that comes built-in to Claude.
10:28
So we're actually going to see the underlying skill being used,
10:31
code being run to create this Excel file,
10:34
and then finally the output based on the requirements that we specified.
10:41
We've got our spreadsheet now.
10:42
Here we can see, we've got an Executive Summary,
10:44
Funnel Analysis, Efficiency Analysis.
10:47
And we can go and open this in Google Drive
10:49
or download this spreadsheet.
10:52
Through the use of our skill to
10:54
analyze data and give us what we need,
10:56
as well as built-in skills to create spreadsheets,
10:59
we can transform data from CSVs into meaningful, actionable insights
11:04
in many different kinds of file formats.
11:06
Next, we'll explore in a little bit more depth
11:09
what a skill looks like, how it works,
11:12
and where it fits into the entire AI ecosystem.