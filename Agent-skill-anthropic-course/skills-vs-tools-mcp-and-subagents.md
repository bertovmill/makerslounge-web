0:00
You can combine skills with tools, MCP, and subagents
0:03
to create powerful agentic workflows.
0:06
Let's go through each component, see how they work together
0:09
and learn when to use what.
0:11
I'll see you there. In this lesson,
0:13
we're going to explore how skills fit in to the agent ecosystem.
0:18
With so many different technologies,
0:21
like MCP, skills, tools, and subagents,
0:24
let's make sure we understand how they all work together.
0:28
In your existing applications,
0:30
we can bring in MCP servers for the context that we need.
0:33
leverage subagents for their own
0:35
main thread and parallelization
0:38
and bring in skills for those repeatable workflows.
0:41
Let's see this in a little more depth.
0:44
When we compare skills with the model context protocol,
0:47
we want to think a lot about working with external data systems
0:51
and bringing in the tools and resources that we need.
0:54
The model context protocol connects our agent or AI applications
0:58
with external systems and data.
1:01
That could be an external database,
1:03
data from Google Drive.
1:04
using a various array of systems,
1:08
but anytime that you need external data
1:10
and context that the model doesn't know about,
1:12
the model context protocol is extremely helpful.
1:15
The skills that you have can leverage
1:18
those underlying tools and data
1:20
from the model context protocol
1:23
to teach your agent what to do with that data.
1:26
Think of the model context protocol
1:28
as bringing in all of the underlying tooling that we need,
1:32
and the skill as the set
1:34
of instructions to put those tools together
1:36
to build particular workflows that are repeatable
1:39
and produce the kind of data that you want.
1:42
As we think about leveraging external data
1:44
to compute metrics and research and calculate data,
1:48
all of those underlying tools can be provided externally
1:51
through the model context protocol. When we
1:54
think a little bit about skills versus tools,
1:56
I like to draw the analogy of tools
1:59
as a little bit more lower level.
2:01
You can imagine that you have tools
2:04
like a hammer and a saw and some nails.
2:06
And you have a skill, like how to build a bookshelf.
2:09
The tools themselves are underlying ways
2:12
of accessing systems and providing agents
2:17
with the capabilities they need to accomplish a task.
2:20
In fact, tools are used under the hood to power the ability
2:24
to generate skills, to read skills,
2:26
and even to produce a Filesystem
2:29
for executing code and loading these skills.
2:32
Skills extend the capabilities with specialized knowledge,
2:36
bringing in additional files and scripts that need to be executed,
2:40
but the ability to execute those underlying scripts
2:43
and load those files and folders is provided by tools.
2:47
There are tools that are built in to certain agentic ecosystems,
2:51
there are tools that we can write on our own,
2:53
and tools that we can load through the model context protocol.
2:57
Tool definitions always live in the context window,
3:00
whereas skills are progressively loaded when necessary.
3:04
When we think about how these work together,
3:06
skills allow us to create predictable workflows,
3:10
and those skills can bring in scripts that can be executed
3:14
kind of like a tool on demand.
3:16
If there is a tool that we do not need
3:18
in every single conversation
3:20
we can use that only when needed
3:22
through skills and progressive disclosure.
3:25
When we think about how subagents fit into the mix,
3:28
let's first define what we think of as a subagent.
3:31
We have a main agent that can spawn or create subagents
3:35
that can report back to the parent agent.
3:38
These subagents can be created through ecosystems like Claude Code
3:41
or the agent SDK,
3:43
or we can also make our own.
3:45
When we think of the value that subagents provide,
3:48
we think a lot about having an isolated context
3:51
with fine-grained permissions,
3:53
as well as executing tasks in parallel.
3:56
When we think about what these Subagents can access,
3:59
we have limited tool permissions, and we also can specify
4:03
what skills each subagent can access.
4:06
So while the main agent can serve as an orchestrator
4:09
and can leverage whatever Skills necessary,
4:12
Subagents can do the same type of idea
4:14
with making use of particular skills.
4:17
Subagents work quite nicely with skills
4:19
where we can have a particular subagent like a Code Reviewer,
4:23
whose sole task is to analyze and review a code base
4:26
and leverages skills which specify exactly
4:29
how you, your team, or your company might perform a code review.
4:34
When we put this all together, we can provide an analogy
4:37
of a Customer Insight Analyzer.
4:39
Let's think about how this all works together.
4:41
We have a main agent that is given a set of tools.
4:44
Those tools could be provided from MCP servers
4:47
we can bring in the data, the resources,
4:49
the tools necessary to perform the tasks needed.
4:53
For dispatching subagents to analyze customers,
4:56
we might analyze interviews from customers or surveys from customers,
5:00
do those in isolation and parallelize them
5:03
to get data back even faster.
5:05
When we think about how to actually analyze insights from customers,
5:10
how to categorize feedback, summarize findings,
5:13
how to analyze interviews and surveys,
5:15
and how to make sure we do those in a predictable fashion
5:18
with the right tools loaded at the right time,
5:21
that's where skills come into play.
5:23
We bring in data externally.
5:25
We leverage subagents if we need to parallelize
5:28
and execute in a separate thread and context window,
5:31
and we bring in skills to consume all of
5:35
this information in a predictable, repeatable, and portable fashion.
5:38
To summarize this, there are many different pieces in
5:41
the AI ecosystem when we think about building AI applications.
5:45
Fundamentally, we have prompts,
5:47
the underlying most atomic unit in a conversation.
5:50
Prompts are the underlying tool for us to communicate with models.
5:54
But prompts themselves don't scale very well
5:57
across teams and companies.
5:59
To bundle these underlying prompts and conversations
6:02
and code and assets, we can leverage skills.
6:06
Subagents that we have tasks delegated to can make use of skills.
6:10
Those subagents can then consume tools necessary
6:13
from a main agent that are defined
6:15
through the model context protocol.
6:18
As we think about what these particular features aim to solve,
6:22
we want to be really intentional about how we're loading this information
6:26
and what this is best used for.
6:28
When we think about the context window as a public good,
6:31
we want to be intentional about when subagents can help us minimize
6:34
what goes in the main context window
6:36
and how MCP can load the data necessary
6:39
and skills can load it progressively.
6:41
When we talk a little bit about the persistence
6:44
and how we can think about drawing things into a longer-term memory.
6:48
With subagents, we can persist across many different
6:50
sessions from the subagent and the parent agent.
6:54
With skills, we can persist across conversations that we have
6:57
with the user and the AI application.
7:00
So as we think about where each of these steps are used,
7:04
we want to use skills for procedural, predictable workflows
7:08
and subagents for full agentic logic
7:10
only when necessary for specialized tasks.
7:14
In the next lesson, we'll take a look
7:16
at some of the pre-built skills that come with Claude.
7:20
We'll take a look at the repository for these skills,
7:22
dive deep into some of the SKILL.md files
7:25
and talk about a very useful skill called the skill creator,
7:29
so that we don't have to manually
7:31
create all of our skills from scratch.