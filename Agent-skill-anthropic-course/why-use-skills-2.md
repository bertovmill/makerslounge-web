0:00
In the previous lesson, we saw how to create skills in Claude
0:03
and move from prompts with data to package skills
0:06
that we can use across many different conversations.
0:10
Now let's dive deeper and talk about what skills are
0:13
and the open standard that powers them.
0:15
Similar to the model context protocol,
0:18
skills themselves are an open standard
0:21
that can be used across many different AI applications.
0:25
While skills were something originally created at Anthropic.
0:29
Skills themselves are now an open standard
0:32
with a specific specification
0:34
that is used across many different platforms,
0:37
including Codex, Gemini CLI,
0:39
Claude Code, Open Code, and much more.
0:42
With that in mind, let's talk
0:43
a little bit about how this works.
0:45
When we build AI applications, in order to use particular skills,
0:50
we need to make use of some kind of file system
0:53
when using tools like Claude AI or Claude Desktop.
0:57
In that file system, we load folders
0:59
that contain a SKILL.md file
1:02
and subfolders or files that can be referenced.
1:05
Here we can see exactly what we did previously.
1:08
At the same time, skills themselves
1:11
cannot only include other markdown documents,
1:14
but scripts that can be executed.
1:17
For example, we have a skill for working with PDF documents.
1:21
we need to convert PDFs to images,
1:23
extract info from form fields,
1:26
and even fill PDF forms with annotations.
1:29
This requires code to be executed.
1:31
But that code that needs to be executed
1:34
can be referenced from the SKILL.md file.
1:36
So as we start to explore
1:38
our own custom skills and built-in skills,
1:41
it's important to note that skills are not
1:43
just text files that reference other text files,
1:46
but text files that can reference scripts,
1:49
what they do, and when they need to be executed.
1:52
Skills can also include icons, images, and other assets
1:56
as we start to think about
1:59
ways of creating custom styles and brands.
2:01
Where skills really shine are places
2:04
where Claude might not know exactly how you or your company operates.
2:09
You can imagine designing newsletters, creating brand guides,
2:13
things that Claude has a general idea on,
2:16
but not the exact way that
2:18
your company or your team does it.
2:20
To give some more idea of why we bring
2:23
agent skills into the mix when we're building our own agents.
2:27
The way that we used to think about building agents
2:29
centered around agents with a single purpose.
2:32
Coding, research, finance, marketing, and much more.
2:36
These domain-specific agents
2:38
had a particular set of tools, the context
2:40
that it needed to perform the task necessary.
2:43
But as we started to build more of these single-purpose agents,
2:46
we started to realize that under the hood,
2:49
all that they really need is a simple scaffolding.
2:52
Underlying tools like bash and a filesystem,
2:55
to find, edit, modify, execute,
2:57
and perform whatever tasks are necessary.
3:01
These simpler agents are easier to evaluate, understand, and scale.
3:06
But what these agents lacked was the underlying
3:09
context and domain expertise to do the job reliably.
3:12
That context can be provided through skills, through the model context protocol,
3:17
but that domain expertise is really where skills shine as well.
3:21
We want finance agents to perform financial analysis in a particular fashion.
3:25
We want research agents to have the domain expertise
3:28
necessary to research the way that we want.
3:31
to be able to port that across many different ecosystems
3:34
and agents, and that's why we have agent skills.
3:37
These skills provide us the procedural knowledge
3:40
and the user-specific context that they can load on demand.
3:44
In addition to domain expertise,
3:47
skills can also provide a repeatable workflow.
3:50
In a non-deterministic system,
3:52
where we don't always know exactly what the
3:54
output of the model is going to be,
3:56
it can be difficult to find repeatable ways
3:58
of producing the same output.
4:00
What skills allow us to do is provide a repeatable workflow.
4:04
with very articulate steps or instructions
4:07
that allow the agent to perform a task
4:10
that we can start to predict with more accuracy.
4:13
Skills also introduce the idea of new capabilities,
4:16
things that an agent does not know
4:17
how to do out of the box
4:19
or even data that Claude has no idea how to operate on.
4:23
When we bring in these new capabilities,
4:26
we unleash an entire ecosystem and new functionality for our agents
4:30
with minimal additional context.
4:32
As we think about domain expertise,
4:34
we want to lean on things that
4:36
Claude might not know how to do
4:38
or knows how to do but not for your particular domain.
4:43
Claude can perform data analysis.
4:45
Claude can perform legal review.
4:47
But how does it do it the way that you
4:49
or your team or company want it to be done?
4:52
We previously saw the ability to perform weekly marketing campaign reviews,
4:56
and we want that to be
4:58
predictable across many different individuals and teams.
5:00
As we start to think about some of these new capabilities,
5:03
things like generating presentations, Excel spreadsheets, PDF reports,
5:08
executing scripts when necessary to perform those actions,
5:11
that here is where agent skills can shine.
5:14
What we saw previously, without skills,
5:16
was the idea of describing our instructions,
5:18
trying to predict workflows and bundling
5:21
all of the necessary files in context at one time.
5:25
We talked a little bit about the portability of skills.
5:28
And while we've seen skills so far in Claude AI,
5:32
skills can be used in the exact same format,
5:35
not only across Claude Code, the Agent SDK and the API,
5:39
but since Agent Skills are an open standard,
5:42
you can use this across a growing number of agent products.
5:45
You can create skills in one environment
5:47
and use them and share them and scale them
5:49
across many different environments.
5:52
When we say that skills are composable,
5:54
this is something that we've seen already.
5:56
We can take custom skills like analyzing our marketing campaign
6:00
and we can combine that with built-in skills
6:03
like creating PowerPoint presentations,
6:05
PDFs, or Excel spreadsheets.
6:07
Not only can we use multiple skills together,
6:10
but we can combine them to build complex and predictable workflows.
6:15
We can reference the skills necessary, the steps necessary,
6:19
and start to create predictable outputs
6:22
in a non-deterministic system.
6:24
Under the hood, skills can contain quite a bit of information.
6:28
We saw examples with additional markdown files
6:30
and even examples with scripts that can be executed.
6:34
You can have hundreds of skills across your system,
6:36
and what we're going to see quite a bit more
6:39
is that to protect the context window,
6:41
skills are progressively disclosed.
6:43
The idea of Progressive Disclosure
6:46
is to only load the data necessary
6:48
and avoid polluting the context.
6:51
We like to think of the context window as a public good.
6:55
The more data that we add to the context window,
6:57
the more tokens we consume,
6:59
the faster our context window fills up,
7:01
and the likelihood of context degradation
7:04
or incorrect responses potentially increases.
7:07
In order to avoid polluting the context window
7:10
with data that we might not need,
7:12
skills introduce the idea of Progressive Disclosure.
7:16
When skills are loaded from the file system,
7:18
the only data that gets added to the context window
7:21
is the name and description of the skill.
7:24
This is essential so that Claude or any other system knows
7:27
what the skill is and how to trigger it.
7:30
Once that skill is triggered, the underlying SKILL.md is loaded.
7:35
This is the next phase of loading data into context.
7:38
And depending on what is required,
7:41
if there are additional files or scripts
7:43
that need to be loaded and executed,
7:46
those will be loaded progressively.
7:48
These additional resources can be loaded as needed,
7:52
and if there are scripts that need to be loaded,
7:54
those scripts are loaded and executed separately from the context window
7:59
to avoid polluting with additional tokens that are not necessary.
8:03
By using tools like bash and a file system,
8:06
Claude can load only the information that's necessary,
8:10
execute only scripts and reading of files that is necessary,
8:14
and intentionally only add what is necessary to the context window.
8:19
In the next lesson, we'll continue talking about skills
8:22
and particularly how they're used alongside other technologies
8:26
like the model context protocol, sub-agents,
8:29
underlying tools, and much more.