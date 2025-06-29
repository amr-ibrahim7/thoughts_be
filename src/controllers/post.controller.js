import postModel from "../models/post.model.js";
import userModel from "../models/user.model.js";

export const allPost = async (req, res) => {
  const { postId, page, limit } = req.query;

  try {
    if (postId) {
      try {
        const post = await postModel
          .findById(postId)
          .populate("author", "name profilePicture")
          .populate("comments.user", "name profilePicture");
        if (post) {
          return res.json(post);
        }
      } catch (err) {
        return res.status(400).json({ error: "Post Not Found" });
      }
    } else {
      if (page && limit) {
        const pageNumber = parseInt(page);
        const limitNumber = parseInt(limit);

        const totalPosts = await postModel.countDocuments();

        const posts = await postModel
          .find()
          .populate("author", "name profilePicture")
          .populate("comments.user", "name profilePicture")
          .sort({ createdAt: -1 })
          .skip((pageNumber - 1) * limitNumber)
          .limit(limitNumber);

        return res.json({
          posts,
          totalPages: Math.ceil(totalPosts / limitNumber),
          currentPage: pageNumber,
        });
      } else {
        const posts = await postModel
          .find()
          .populate("author", "name profilePicture")
          .populate("comments.user", "name profilePicture")
          .sort({ createdAt: -1 });

        return res.json(posts);
      }
    }
  } catch (error) {
    res.status(500).json({ error: "Error fetching posts" });
  }
};

export const createPost = async (req, res) => {
  try {
    const { title, content, category } = req.body;
    const user = await userModel.findById(req.user._id);

    if (!title || title.trim() === "" || !content || content.trim() === "") {
      return res.status(400).json({
        status: "error",
        message:
          "Fields are required and cannot be empty or contain only spaces.",
      });
    }

    const post = await postModel.create({
      title,
      content,
      category,
      author: user._id,
    });

    user.posts.push(post);
    await user.save();

    if (req.file) {
      const base64Image = req.file.buffer.toString("base64");
      post.thumbnail = `data:${req.file.mimetype};base64,${base64Image}`;
      await post.save();
    }

    res.status(201).json({
      status: "success",
      message: "Post created successfully!",
      data: post,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const updatePost = async (req, res) => {
  try {
    const { postId } = req.query;

    if (!postId) {
      return res.status(400).json({
        status: "error",
        message: "postId query parameter is required!",
      });
    }

    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found!",
      });
    }

    if (post.author.toString() === req.user._id.toString()) {
      const { title, content, category } = req.body;

      if (title) post.title = title;
      if (content) post.content = content;
      if (category) post.category = category;

      if (req.file) {
        const base64Image = req.file.buffer.toString("base64");
        post.thumbnail = `data:${req.file.mimetype};base64,${base64Image}`;
        await post.save();
      }

      await post.save();

      res.status(200).json({
        status: "success",
        message: "Post updated successfully!",
        data: post,
      });
    } else {
      res.status(401).json({
        status: "error",
        message: "You are not authorized to update this post!",
      });
    }
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const deletePost = async (req, res) => {
  try {
    const { postId } = req.query;

    if (!postId) {
      return res.status(400).json({
        status: "error",
        message: "postId query parameter is required!",
      });
    }

    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found!",
      });
    }

    if (post.author.toString() === req.user._id.toString()) {
      await postModel.deleteOne({ _id: postId });

      await userModel.findByIdAndUpdate(
        req.user._id,
        {
          $pull: {
            posts: postId,
          },
        },
        { new: true }
      );

      return res.status(200).json({
        status: "success",
        message: "Post deleted successfully!",
      });
    } else {
      return res.status(401).json({
        status: "error",
        message: "You are not authorized to delete this post!",
      });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const postByCategory = async (req, res) => {
  const { category } = req.query;

  try {
    if (!category) {
      return res.status(400).json({
        status: "error",
        message: "category query parameter is required!",
      });
    }

    const posts = await postModel
      .find({ category })
      .populate("author", "name profilePicture")
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const postByAuthor = async (req, res) => {
  const { authorId } = req.query;

  try {
    if (!authorId) {
      return res.status(400).json({
        status: "error",
        message: "authorId query parameter is required!",
      });
    }

    const posts = await postModel
      .find({ author: authorId })
      .sort({ createdAt: -1 });

    res.json(posts);
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};
export const addComment = async (req, res) => {
  try {
    const { postId } = req.params;
    const { comment } = req.body;
    const userId = req.user._id;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({
        status: "error",
        message: "Comment cannot be empty!",
      });
    }

    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found!",
      });
    }

    post.comments.push({
      user: userId,
      comment: comment.trim(),
    });

    await post.save();

    const updatedPost = await postModel
      .findById(postId)
      .populate("comments.user", "name profilePicture")
      .populate("author", "name profilePicture");

    res.status(201).json({
      status: "success",
      message: "Comment added successfully!",
      data: updatedPost.comments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};

export const deleteComment = async (req, res) => {
  try {
    const { postId, commentId } = req.params;
    const userId = req.user._id;

    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).json({
        status: "error",
        message: "Post not found!",
      });
    }

    const commentIndex = post.comments.findIndex(
      (comment) => comment._id.toString() === commentId
    );

    if (commentIndex === -1) {
      return res.status(404).json({
        status: "error",
        message: "Comment not found!",
      });
    }

    const comment = post.comments[commentIndex];
    if (
      comment.user.toString() !== userId.toString() &&
      post.author.toString() !== userId.toString()
    ) {
      return res.status(403).json({
        status: "error",
        message: "Not authorized to delete this comment!",
      });
    }

    post.comments.splice(commentIndex, 1);
    await post.save();

    res.status(200).json({
      status: "success",
      message: "Comment deleted successfully!",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      message: "Internal server error!",
    });
  }
};
